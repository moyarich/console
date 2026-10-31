import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const dir = join(root, "dist");
const src = join(root, "src");
if (!existsSync(dir)) throw new Error("Build output dist/ is missing");

let count = 0;
function fixImports(content, extension) {
  return content
    .replace(/^import\s+["'][^"']+\.css["'];?\s*$/gm, "")
    .replace(/(["'])(\.\.?\/[^"'\n]+)\1/g, (match, quote, specifier) => {
      if (/\.(?:js|jsx|mjs|cjs|json|css|wasm)$/.test(specifier)) return match;
      return quote + specifier + extension + quote;
    });
}
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) {
      walk(file);
    } else if (/\.(?:test|spec)\.d\.(?:ts|cts)$/.test(entry.name)) {
      rmSync(file);
    } else if (entry.name.endsWith(".d.ts")) {
      const content = readFileSync(file, "utf8");
      writeFileSync(file, fixImports(content, ".js"));
      writeFileSync(
        file.replace(/\.d\.ts$/, ".d.cts"),
        fixImports(content, ".cjs"),
      );
      count++;
    }
  }
}
function copyJson(folder) {
  if (!existsSync(folder)) return;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) copyJson(file);
    else if (entry.name.endsWith(".json")) {
      const output = join(dir, file.slice(src.length + 1));
      mkdirSync(dirname(output), { recursive: true });
      copyFileSync(file, output);
    }
  }
}
walk(dir);
copyJson(src);
if (count === 0)
  throw new Error("No TypeScript declaration files found in dist/");
console.log(`Prepared ${count} ESM and CommonJS declarations`);
