import fs from "node:fs/promises";
import path from "node:path";
import { PROMPTS_DIR } from "./paths.js";
import { parseFrontmatter } from "./frontmatter.js";

// Loads every frozen prompt file from /prompts, sorted by filename so the
// numeric prefixes (01-, 02-, ...) control ordering.
export async function loadPrompts() {
  const files = (await fs.readdir(PROMPTS_DIR))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const prompts = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(PROMPTS_DIR, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    if (!data.id) {
      throw new Error(`Prompt file ${file} is missing an "id" in frontmatter`);
    }
    prompts.push({
      id: data.id,
      title: data.title || data.id,
      category: data.category || "uncategorized",
      version: data.version || "1",
      file,
      fullText: raw.trim(),
      body: body.trim(),
    });
  }
  return prompts;
}
