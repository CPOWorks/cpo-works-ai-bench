#!/usr/bin/env node
// Sends each anonymized model output from a run to 1-2 "judge" LLMs, asking
// them to score it against the same rubric used in scoring/index.html.
//
// Like the human scoring UI, judges only ever see the frozen task prompt and
// an anonymized "model_A"-style label — never mapping.secret.json — so a
// judge model can't (consciously) favor outputs it recognizes as its own.
//
// Usage:
//   npm run judge-models -- --run-id 2026-07-04T19-18-00-000Z
//   npm run judge-models -- --run-id <id> --judges judge-anthropic
//   npm run judge-models -- --run-id <id> --tasks prd-writing,voice-check

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { RUNS_DIR, CONFIG_DIR, JUDGE_SCORES_DIR } from "./lib/paths.js";
import { callProvider } from "./lib/providers.js";
import { parseArgs, csvList } from "./lib/cli.js";

async function loadJSON(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function buildJudgePrompt(rubric, taskPrompt, candidateOutput) {
  const dimLines = rubric.dimensions
    .map((d) => `- "${d.id}" (${d.label}): ${d.description}`)
    .join("\n");

  return `You are an expert product-org evaluator judging one AI model's response to a fixed task brief, on a shared rubric. Score strictly and independently — do not be lenient by default.

## Rubric (score each dimension 1-${rubric.scale.max}, integers only, ${rubric.scale.min} = poor, ${rubric.scale.max} = excellent)
${dimLines}

## The task brief that was given to the model being judged
"""
${taskPrompt}
"""

## The model's response (this is what you are scoring)
"""
${candidateOutput || "(no output — generation may have failed)"}
"""

## Your output
Respond with ONLY a single JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "dims": { ${rubric.dimensions.map((d) => `"${d.id}": <integer ${rubric.scale.min}-${rubric.scale.max}>`).join(", ")} },
  "notes": "<2-4 sentences of specific justification>"
}`;
}

function extractJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in judge response: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

function computeOverall(dims, rubric) {
  const values = rubric.dimensions.map((d) => dims[d.id]).filter((v) => typeof v === "number");
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = args["run-id"];
  if (!runId) {
    console.error("Usage: npm run judge-models -- --run-id <runId> [--judges key1,key2] [--tasks id1,id2]");
    process.exit(1);
  }

  const runDir = path.join(RUNS_DIR, runId);
  const manifest = await loadJSON(path.join(runDir, "manifest.json"));
  const rubric = await loadJSON(path.join(CONFIG_DIR, "rubric.json"));

  const allJudges = await loadJSON(path.join(CONFIG_DIR, "judges.json"));
  const judgeFilter = csvList(args.judges);
  let judges = allJudges;
  if (judgeFilter) judges = judges.filter((j) => judgeFilter.includes(j.key));
  judges = judges.filter((j) => {
    const hasKey = Boolean(process.env[j.envKey]);
    if (!hasKey) console.warn(`Skipping judge "${j.key}": env var ${j.envKey} is not set.`);
    return hasKey;
  });
  if (judges.length === 0) {
    console.error("No judges with API keys available. Check config/judges.json and .env.");
    process.exit(1);
  }

  const taskFilter = csvList(args.tasks);
  let tasks = manifest.tasks;
  if (taskFilter) tasks = tasks.filter((t) => taskFilter.includes(t.taskId));

  const outDir = path.join(JUDGE_SCORES_DIR, runId);
  await fs.mkdir(outDir, { recursive: true });

  for (const judge of judges) {
    console.log(`Judge "${judge.key}" (${judge.provider}/${judge.model}):`);
    const scores = [];

    for (const task of tasks) {
      const taskDir = path.join(runDir, task.taskId);
      const taskPrompt = await fs.readFile(path.join(taskDir, "prompt.md"), "utf8");

      for (const label of task.labels) {
        const candidate = await loadJSON(path.join(taskDir, `${label}.json`));
        process.stdout.write(`  [${task.taskId}] ${label} ... `);

        if (candidate.error || !candidate.output) {
          console.log("skipped (no output to judge)");
          continue;
        }

        try {
          const judgePrompt = buildJudgePrompt(rubric, taskPrompt, candidate.output);
          const result = await callProvider(judge, judgePrompt);
          const parsed = extractJSON(result.text);
          const overall = computeOverall(parsed.dims || {}, rubric);
          scores.push({
            taskId: task.taskId,
            label,
            dims: parsed.dims || {},
            overall,
            notes: parsed.notes || "",
          });
          console.log(`ok (overall ${overall !== null ? overall.toFixed(2) : "n/a"})`);
        } catch (err) {
          console.log(`FAILED: ${err.message}`);
        }
      }
    }

    const payload = {
      runId,
      scorer: "judge",
      judgeKey: judge.key,
      judgeModel: { provider: judge.provider, model: judge.model },
      rubricVersion: rubric.version,
      generatedAt: new Date().toISOString(),
      scores,
    };
    const outFile = path.join(outDir, `${judge.key}.json`);
    await fs.writeFile(outFile, JSON.stringify(payload, null, 2));
    console.log(`  -> saved judge-scores/${runId}/${judge.key}.json\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
