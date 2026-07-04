#!/usr/bin/env node
// Combines your (human) rubric scores with judge-LLM rubric scores into a
// single weighted leaderboard, de-anonymizing model_A/B/C back to real
// model names using runs/<runId>/mapping.secret.json, and writes a
// self-contained HTML report.
//
// Usage:
//   npm run build-leaderboard -- --run-id <runId>
//   npm run build-leaderboard -- --run-id <runId> --human-weight 0.7 --judge-weight 0.3
//   npm run build-leaderboard -- --run-id <runId> --human path/to/human-scores.json --judges path/a.json,path/b.json

import fs from "node:fs/promises";
import path from "node:path";
import { RUNS_DIR, SCORES_DIR, JUDGE_SCORES_DIR, LEADERBOARD_DIR } from "./lib/paths.js";
import { parseArgs, csvList } from "./lib/cli.js";

async function loadJSON(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function findFiles(dir, predicate) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  return entries.filter(predicate).map((f) => path.join(dir, f));
}

// Averages a list of {overall} score records into a single number, ignoring nulls.
function average(values) {
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function weightedCombine(parts) {
  // parts: [{ value, weight }], skips entries with value === null
  const usable = parts.filter((p) => typeof p.value === "number");
  const totalWeight = usable.reduce((a, p) => a + p.weight, 0);
  if (usable.length === 0 || totalWeight === 0) return null;
  return usable.reduce((a, p) => a + p.value * p.weight, 0) / totalWeight;
}

function modelIdentity(entry) {
  // entry: { key, provider, model } from mapping.secret.json
  return `${entry.provider}:${entry.model}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreClass(score) {
  if (score === null || score === undefined) return "na";
  if (score >= 4) return "good";
  if (score >= 3) return "mid";
  return "low";
}

function fmt(score) {
  return score === null || score === undefined ? "—" : score.toFixed(2);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = args["run-id"];
  if (!runId) {
    console.error("Usage: npm run build-leaderboard -- --run-id <runId> [--human-weight 0.6] [--judge-weight 0.4]");
    process.exit(1);
  }
  const humanWeight = args["human-weight"] !== undefined ? Number(args["human-weight"]) : 0.6;
  const judgeWeight = args["judge-weight"] !== undefined ? Number(args["judge-weight"]) : 0.4;

  const runDir = path.join(RUNS_DIR, runId);
  const manifest = await loadJSON(path.join(runDir, "manifest.json"));
  const mapping = (await loadJSON(path.join(runDir, "mapping.secret.json"))).mapping;

  const humanPaths = csvList(args.human) || (await findFiles(SCORES_DIR, (f) => f.includes(runId) && f.endsWith(".json")));
  const judgePaths = csvList(args.judges) || (await findFiles(path.join(JUDGE_SCORES_DIR, runId), (f) => f.endsWith(".json")));

  console.log(`Run: ${runId}`);
  console.log(`Human score files: ${humanPaths.length ? humanPaths.join(", ") : "(none found)"}`);
  console.log(`Judge score files: ${judgePaths.length ? judgePaths.join(", ") : "(none found)"}`);

  // key: `${taskId}::${label}` -> array of overall scores
  const humanScoresByKey = new Map();
  for (const p of humanPaths) {
    const data = await loadJSON(p);
    for (const s of data.scores || []) {
      const key = `${s.taskId}::${s.label}`;
      if (!humanScoresByKey.has(key)) humanScoresByKey.set(key, []);
      humanScoresByKey.get(key).push(s.overall);
    }
  }

  const judgeScoresByKey = new Map();
  const judgeNames = [];
  for (const p of judgePaths) {
    const data = await loadJSON(p);
    judgeNames.push(data.judgeKey || path.basename(p));
    for (const s of data.scores || []) {
      const key = `${s.taskId}::${s.label}`;
      if (!judgeScoresByKey.has(key)) judgeScoresByKey.set(key, []);
      judgeScoresByKey.get(key).push(s.overall);
    }
  }

  // Build per-task, per-model rows.
  const perTaskRows = []; // { taskId, taskTitle, modelId, provider, model, human, judge, combined }
  const modelAgg = new Map(); // modelId -> { provider, model, combinedScores: [] }

  for (const task of manifest.tasks) {
    for (const label of task.labels) {
      const key = `${task.taskId}::${label}`;
      const mapEntry = mapping[task.taskId]?.[label];
      if (!mapEntry) continue;
      const modelId = modelIdentity(mapEntry);

      const human = average(humanScoresByKey.get(key) || []);
      const judge = average(judgeScoresByKey.get(key) || []);
      const combined = weightedCombine([
        { value: human, weight: humanWeight },
        { value: judge, weight: judgeWeight },
      ]);

      perTaskRows.push({
        taskId: task.taskId,
        taskTitle: task.title,
        modelId,
        provider: mapEntry.provider,
        model: mapEntry.model,
        human,
        judge,
        combined,
      });

      if (!modelAgg.has(modelId)) {
        modelAgg.set(modelId, { provider: mapEntry.provider, model: mapEntry.model, combinedScores: [] });
      }
      if (combined !== null) modelAgg.get(modelId).combinedScores.push(combined);
    }
  }

  const leaderboard = [...modelAgg.entries()]
    .map(([modelId, v]) => ({
      modelId,
      provider: v.provider,
      model: v.model,
      overall: average(v.combinedScores),
      tasksScored: v.combinedScores.length,
    }))
    .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));

  const taskIds = manifest.tasks.map((t) => t.taskId);
  const recommendationByTask = taskIds.map((taskId) => {
    const rows = perTaskRows
      .filter((r) => r.taskId === taskId)
      .sort((a, b) => (b.combined ?? -1) - (a.combined ?? -1));
    return { taskId, taskTitle: rows[0]?.taskTitle || taskId, rows };
  });

  const html = renderHTML({
    runId,
    humanWeight,
    judgeWeight,
    judgeNames,
    humanFileCount: humanPaths.length,
    leaderboard,
    recommendationByTask,
  });

  const outDir = path.join(LEADERBOARD_DIR, runId);
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");
  await fs.writeFile(outFile, html);
  console.log(`\nLeaderboard written to leaderboard/${runId}/index.html`);
}

function renderHTML({ runId, humanWeight, judgeWeight, judgeNames, humanFileCount, leaderboard, recommendationByTask }) {
  const leaderboardRows = leaderboard
    .map(
      (m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(m.provider)}</td>
        <td>${escapeHtml(m.model)}</td>
        <td class="score ${scoreClass(m.overall)}">${fmt(m.overall)}</td>
        <td>${m.tasksScored}</td>
      </tr>`
    )
    .join("");

  const taskTables = recommendationByTask
    .map((t) => {
      const rows = t.rows
        .map(
          (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(r.provider)}</td>
          <td>${escapeHtml(r.model)}</td>
          <td class="score ${scoreClass(r.human)}">${fmt(r.human)}</td>
          <td class="score ${scoreClass(r.judge)}">${fmt(r.judge)}</td>
          <td class="score ${scoreClass(r.combined)}">${fmt(r.combined)}</td>
        </tr>`
        )
        .join("");
      return `
      <h3>${escapeHtml(t.taskTitle)} <span class="task-id">(${escapeHtml(t.taskId)})</span></h3>
      <table>
        <thead><tr><th>#</th><th>Provider</th><th>Model</th><th>Human</th><th>Judge</th><th>Combined</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>CPO Works AI Bench — Leaderboard (${escapeHtml(runId)})</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 960px; margin: 40px auto; padding: 0 20px; line-height: 1.5; }
  h1 { font-size: 22px; }
  h2 { font-size: 17px; margin-top: 40px; border-bottom: 1px solid #8884; padding-bottom: 6px; }
  h3 { font-size: 14px; margin-top: 28px; }
  .task-id { font-weight: 400; color: #888; font-size: 12px; }
  .meta { color: #888; font-size: 13px; margin-bottom: 24px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 12px; font-size: 13px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #8883; }
  th { color: #888; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }
  td.score { font-weight: 700; }
  td.score.good { color: #1a7f37; }
  td.score.mid { color: #b45309; }
  td.score.low { color: #dc2626; }
  td.score.na { color: #888; font-weight: 400; }
</style>
</head>
<body>
  <h1>CPO Works AI Bench — Leaderboard</h1>
  <div class="meta">
    Run: <code>${escapeHtml(runId)}</code> ·
    Weights: human ${humanWeight}, judge ${judgeWeight} ·
    Human score files: ${humanFileCount} ·
    Judges: ${judgeNames.length ? judgeNames.map(escapeHtml).join(", ") : "(none)"}
  </div>

  <h2>Overall leaderboard</h2>
  <table>
    <thead><tr><th>#</th><th>Provider</th><th>Model</th><th>Combined score</th><th>Tasks scored</th></tr></thead>
    <tbody>${leaderboardRows}</tbody>
  </table>

  <h2>Model-by-task recommendations</h2>
  ${taskTables}
</body>
</html>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
