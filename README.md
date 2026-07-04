# cpo-works-ai-bench

Repeatable AI model benchmark for CPO tasks (PRD writing, roadmap tradeoff
memo, exec update, stakeholder comms, prototype spec, agentic multi-step
task, voice check).

Every new frontier model release gets run through the same 7 frozen prompts,
scored **blind** by you on a shared rubric, cross-checked by 1-2 LLM judges
on the same rubric, and combined into a weighted leaderboard.

## How it fits together

```
prompts/            7 frozen (do-not-edit) task briefs, shared fictional
                     product context across all of them
config/models.json   which models to test (provider + model id)
config/judges.json   which models act as judges
config/rubric.json   shared 1-5 rubric (used by scoring UI AND judges)

scripts/run-models.js       -> calls each model, saves outputs anonymized
                                as model_A / model_B / ... under /runs
scoring/index.html           -> you rate the anonymized outputs in a
                                 browser, download your scores as JSON
scripts/judge-models.js     -> 1-2 LLM judges rate the same anonymized
                                outputs on the same rubric
scripts/build-leaderboard.js -> combines your scores + judge scores
                                (weighted), de-anonymizes, writes an HTML
                                leaderboard + model-by-task table
```

**Blind by design**: `run-models.js` shuffles model order per task and
writes only `model_A.json` / `model_B.json` / ... — the real model behind
each label lives solely in `runs/<runId>/mapping.secret.json`, which is
gitignored and is never read by the scoring UI or by the judge script.
Only `build-leaderboard.js` reads it, at the very end, to reveal real names.

## Setup

```bash
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY in .env
```

Check `config/models.json` and `config/judges.json` before your first run —
the `model` strings there (e.g. `claude-sonnet-5`, `gpt-5.1`, `gemini-3-pro`)
are placeholders. Providers rename/retire model IDs frequently; confirm the
current ID in each provider's docs before relying on it.

## Usage

**1. Generate outputs for a new release round**

```bash
npm run run-models
# or scope it:
npm run run-models -- --tasks prd-writing,voice-check
npm run run-models -- --models anthropic-1,openai-1
npm run run-models -- --run-id 2026-08-release
```

This writes `runs/<runId>/manifest.json`, `runs/<runId>/mapping.secret.json`,
and per-task folders with `prompt.md` + one `model_X.json` per model.

**2. Score blind**

Open `scoring/index.html` directly in a browser (no server needed — it's a
plain static page). Click "Load run folder…" and select `runs/<runId>`.
Rate each anonymized output on the rubric, then click "Download results
(JSON)". Save the downloaded file into `/scores/`.

**3. Run LLM judges**

```bash
npm run judge-models -- --run-id <runId>
```

Saves one file per judge to `judge-scores/<runId>/<judgeKey>.json`.

**4. Build the leaderboard**

```bash
npm run build-leaderboard -- --run-id <runId>
# adjust weighting:
npm run build-leaderboard -- --run-id <runId> --human-weight 0.7 --judge-weight 0.3
```

Reads every `scores/*<runId>*.json` and `judge-scores/<runId>/*.json` file it
finds (unless you pass `--human` / `--judges` with explicit comma-separated
paths), de-anonymizes via `mapping.secret.json`, and writes
`leaderboard/<runId>/index.html` with an overall ranking and a
model-by-task recommendation table.

## Notes

- `/runs`, `/scores`, `/judge-scores`, `/leaderboard` are gitignored (generated
  data, some of it containing full LLM outputs) — only `.gitkeep` placeholders
  are committed.
- `.env` is gitignored; only `.env.example` is committed. Never hardcode keys.
- To add an 8th task, add a new frontmatter-tagged `.md` file to `/prompts` —
  everything downstream picks it up automatically.
