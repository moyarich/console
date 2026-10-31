import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const src = join(root, "src");
const dist = join(root, "dist");
const styles = [];
function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (entry.name.endsWith(".css")) styles.push(file);
  }
}
if (!existsSync(src) || !existsSync(dist)) throw new Error("Expected src/ and built dist/");
collect(src);
if (!styles.length) throw new Error("No addon stylesheets found");
mkdirSync(dist, { recursive: true });
writeFileSync(
  join(dist, "styles.css"),
  styles.map(file => `/* ${relative(root, file)} */\n${readFileSync(file, "utf8")}`).join("\n"),
);
console.log(`Exported ${styles.length} stylesheet(s) to dist/styles.css`);
