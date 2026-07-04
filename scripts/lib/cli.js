// Minimal `--key value` / `--key=value` / `--flag` CLI arg parser.
export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const eqIdx = token.indexOf("=");
    if (eqIdx !== -1) {
      args[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
    } else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

export function csvList(value) {
  if (!value) return null;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
