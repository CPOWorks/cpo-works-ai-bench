#!/usr/bin/env node
// Calls each configured model on every frozen prompt, and saves outputs
// under /runs/<runId> under anonymized labels (model_A, model_B, ...).
//
// The mapping from label -> real model is written to
// runs/<runId>/mapping.secret.json, which is gitignored and must NEVER be
// opened by the human scorer or shown to a judge model — that's what keeps
// scoring blind.
//
// Usage:
//   npm run run-models
//   npm run run-models -- --tasks prd-writing,voice-check
//   npm run run-models -- --models anthropic-1,openai-1
//   npm run run-models -- --run-id my-custom-id

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { RUNS_DIR, CONFIG_DIR, timestampId } from "./lib/paths.js";
import { loadPrompts } from "./lib/prompts.js";
import { shuffle, labelFor } from "./lib/shuffle.js";
import { callProvider } from "./lib/providers.js";
import { parseArgs, csvList } from "./lib/cli.js";

async function loadJSON(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = args["run-id"] || timestampId();
  const taskFilter = csvList(args.tasks);
  const modelFilter = csvList(args.models);

  const allModels = await loadJSON(path.join(CONFIG_DIR, "models.json"));
  let models = allModels;
  if (modelFilter) {
    models = models.filter((m) => modelFilter.includes(m.key));
  }
  models = models.filter((m) => {
    const hasKey = Boolean(process.env[m.envKey]);
    if (!hasKey) {
      console.warn(`Skipping model "${m.key}": env var ${m.envKey} is not set.`);
    }
    return hasKey;
  });
  if (models.length === 0) {
    console.error("No models with API keys available. Check your .env file.");
    process.exit(1);
  }

  let prompts = await loadPrompts();
  if (taskFilter) {
    prompts = prompts.filter((p) => taskFilter.includes(p.id));
  }
  if (prompts.length === 0) {
    console.error("No matching prompts found.");
    process.exit(1);
  }

  const runDir = path.join(RUNS_DIR, runId);
  await fs.mkdir(runDir, { recursive: true });

  const manifest = { runId, createdAt: new Date().toISOString(), tasks: [] };
  const mapping = { runId, mapping: {} };

  console.log(`Run "${runId}": ${prompts.length} task(s) x ${models.length} model(s)`);

  for (const prompt of prompts) {
    const taskDir = path.join(runDir, prompt.id);
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, "prompt.md"), prompt.fullText + "\n");

    const order = shuffle(models);
    const labels = [];
    mapping.mapping[prompt.id] = {};

    for (let i = 0; i < order.length; i++) {
      const modelEntry = order[i];
      const label = labelFor(i);
      labels.push(label);
      mapping.mapping[prompt.id][label] = {
        key: modelEntry.key,
        provider: modelEntry.provider,
        model: modelEntry.model,
      };

      process.stdout.write(`  [${prompt.id}] ${label} (${modelEntry.key}) ... `);
      try {
        const result = await callProvider(modelEntry, prompt.body);
        await fs.writeFile(
          path.join(taskDir, `${label}.json`),
          JSON.stringify(
            {
              taskId: prompt.id,
              label,
              output: result.text,
              meta: {
                latencyMs: result.latencyMs,
                requestedAt: new Date().toISOString(),
                promptChars: prompt.body.length,
                outputChars: result.text.length,
              },
            },
            null,
            2
          )
        );
        console.log(`ok (${result.latencyMs}ms, ${result.text.length} chars)`);
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
        await fs.writeFile(
          path.join(taskDir, `${label}.json`),
          JSON.stringify(
            {
              taskId: prompt.id,
              label,
              output: "",
              error: err.message,
              meta: { requestedAt: new Date().toISOString() },
            },
            null,
            2
          )
        );
      }
    }

    manifest.tasks.push({
      taskId: prompt.id,
      title: prompt.title,
      category: prompt.category,
      labels,
    });
  }

  await fs.writeFile(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  await fs.writeFile(
    path.join(runDir, "mapping.secret.json"),
    JSON.stringify(mapping, null, 2)
  );

  console.log(`\nDone. Run saved to runs/${runId}/`);
  console.log(`Blind data for scoring: runs/${runId}/<task>/model_*.json + manifest.json`);
  console.log(`Keep runs/${runId}/mapping.secret.json out of the scoring UI and judge prompts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
