#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const command = process.argv[2];
if (command !== "build" && command !== "pack") {
  console.error("Usage: node scripts/run-addon-workspaces.mjs <build|pack>");
  process.exit(2);
}

const root = resolve(import.meta.dirname, "..");
const addonDirectories = readdirSync(resolve(root, "packages/addons"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const addon of addonDirectories) {
  const workspace = `packages/addons/${addon}`;
  const args =
    command === "build"
      ? ["run", "build", "--workspace", workspace, "--if-present"]
      : ["pack", "--workspace", workspace, "--dry-run"];
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    args,
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
