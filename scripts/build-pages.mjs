#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
// configure-pages supplies the repository prefix (or an empty path for a domain).
const prefix = (process.env.PAGES_BASE_PATH ?? "").replace(/^\/+|\/+$/g, "");
const base = prefix ? `/${prefix}/` : "/";
const output = resolve(root, "dist/pages");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

for (const [script, env] of [
  ["build:playground", { VITE_BASE_PATH: base }],
  ["build-storybook", { STORYBOOK_BASE_PATH: `${base}storybook/` }],
]) {
  const result = spawnSync(npm, ["run", script], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve(root, "apps/playground/dist"), output, { recursive: true });
cpSync(resolve(root, "storybook-static"), resolve(output, "storybook"), {
  recursive: true,
});
writeFileSync(resolve(output, ".nojekyll"), "");
console.log(
  `Pages artifact: ${output}\nPlayground: ${base}\nStorybook: ${base}storybook/`,
);
