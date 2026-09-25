import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  stageExtension,
  writeExtensionSource,
} from "@moyarich/vscode-dev-toolkit/extension";
import config from "../vscode-dev.config.mjs";

const projectDirectory = fileURLToPath(new URL("../", import.meta.url));

await rm(new URL("../dist/", import.meta.url), {
  recursive: true,
  force: true,
});

execFileSync(
  process.execPath,
  [createRequire(import.meta.url).resolve("tsup/dist/cli-default.js")],
  {
    cwd: projectDirectory,
    stdio: "inherit",
  },
);

await writeExtensionSource(config);
await stageExtension(config);
