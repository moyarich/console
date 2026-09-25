import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createVSIX, listFiles } from "@vscode/vsce";
import {
  artifactDirectory,
  extensionDirectory,
  stageExtension,
} from "./stage-extension.mjs";

const manifest = await stageExtension();
const options = {
  cwd: extensionDirectory,
  dependencies: false,
  packagedDependencies: [],
};
if (process.argv.includes("--list")) {
  console.log((await listFiles(options)).join("\n"));
} else {
  await mkdir(artifactDirectory, { recursive: true });
  const packagePath = join(
    artifactDirectory,
    `${manifest.name}-${manifest.version}.vsix`,
  );
  await createVSIX({ ...options, packagePath });
  console.log(`Extension package: ${packagePath}`);
}
