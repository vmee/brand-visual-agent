import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const skippedDirectories = new Set([
  ".git",
  "dist",
  "node_modules",
  "outputs",
  ".pnpm-store",
]);
const skippedFiles = new Set(["pnpm-lock.yaml", "scripts/scan-secrets.mjs"]);
const patterns = [
  [
    "OpenAI/Anthropic-style key",
    new RegExp("\\bsk-" + "[A-Za-z0-9_-]{20,}\\b", "g"),
  ],
  ["Google API key", new RegExp("AI" + "za[0-9A-Za-z_-]{30,}", "g")],
  [
    "literal API key assignment",
    new RegExp(
      "(?:OPENAI|ANTHROPIC|GEMINI|GOOGLE)_API_KEY\\s*[:=]\\s*[\\\"']?[A-Za-z0-9_-]{12,}",
      "g",
    ),
  ],
  [
    "literal bearer token",
    new RegExp(
      "Authorization\\s*[:=]\\s*[\\\"']?Bearer\\s+[A-Za-z0-9._-]{16,}",
      "gi",
    ),
  ],
];

async function filesUnder(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        result.push(
          ...(await filesUnder(path.join(directory, entry.name), relative)),
        );
      }
    } else if (entry.isFile() && !skippedFiles.has(relative)) {
      result.push(relative);
    }
  }
  return result;
}

const findings = [];
for (const relative of await filesUnder(root)) {
  const absolute = path.join(root, relative);
  if ((await stat(absolute)).size > 1024 * 1024) continue;
  const buffer = await readFile(absolute);
  if (buffer.includes(0)) continue;
  const content = buffer.toString("utf8");
  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push(`${relative}:${line}: ${label}`);
    }
  }
}

if (findings.length > 0) {
  process.stderr.write(`Potential secrets found:\n${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Secret scan passed: no high-confidence credential patterns found.\n",
  );
}
