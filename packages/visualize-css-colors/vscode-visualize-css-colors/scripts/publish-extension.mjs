import { createRequire } from "node:module";
import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { artifactDirectory, readManifest } from "./stage-extension.mjs";

if (!process.env.OVSX_PAT) {
  throw new Error(
    "Set OVSX_PAT to an Open VSX token for the moyarich namespace. See README.md for publisher setup.",
  );
}
const manifest = await readManifest();
const packagePath = join(
  artifactDirectory,
  `${manifest.name}-${manifest.version}.vsix`,
);
await access(packagePath);
// OVSX_PAT stays in the environment, never in process arguments or logs.
const child = spawn(
  process.execPath,
  [
    createRequire(import.meta.url).resolve("ovsx/bin/ovsx"),
    "publish",
    packagePath,
  ],
  { stdio: "inherit" },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
