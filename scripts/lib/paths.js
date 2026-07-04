import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, "..", "..");
export const PROMPTS_DIR = path.join(ROOT_DIR, "prompts");
export const CONFIG_DIR = path.join(ROOT_DIR, "config");
export const RUNS_DIR = path.join(ROOT_DIR, "runs");
export const SCORES_DIR = path.join(ROOT_DIR, "scores");
export const JUDGE_SCORES_DIR = path.join(ROOT_DIR, "judge-scores");
export const LEADERBOARD_DIR = path.join(ROOT_DIR, "leaderboard");

export function timestampId(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}
