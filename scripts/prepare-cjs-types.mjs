import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "dist");
if (!existsSync(dir)) throw new Error("Build output dist/ is missing");

let count = 0;
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) {
      walk(file);
    } else if (/\.(?:test|spec)\.d\.(?:ts|cts)$/.test(entry.name)) {
      rmSync(file);
    } else if (entry.name.endsWith(".d.ts")) {
      cpSync(file, file.replace(/\.d\.ts$/, ".d.cts"));
      count++;
    }
  }
}
walk(dir);
if (count === 0)
  throw new Error("No TypeScript declaration files found in dist/");
console.log(`Prepared ${count} CommonJS declaration file(s)`);
