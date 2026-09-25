import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const extensionDirectory = fileURLToPath(
  new URL("../dist/vscode-extension/", import.meta.url),
);
export const artifactDirectory = fileURLToPath(
  new URL("../artifacts/", import.meta.url),
);

export async function readManifest() {
  return JSON.parse(
    await readFile(
      new URL("../extension.manifest.json", import.meta.url),
      "utf8",
    ),
  );
}

export async function stageExtension() {
  const manifest = await readManifest();
  const npmPackage = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  if (manifest.version !== npmPackage.version) {
    throw new Error(
      "Keep package.json and extension.manifest.json versions in sync before building.",
    );
  }
  // Only explicit runtime files enter the VSIX. The scoped npm metadata and
  // development tooling must not become the installed extension's package.json.
  await rm(extensionDirectory, { recursive: true, force: true });
  await mkdir(`${extensionDirectory}/dist`, { recursive: true });
  await writeFile(
    `${extensionDirectory}/package.json`,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  for (const file of [
    "dist/extension.cjs",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
  ]) {
    await copyFile(
      new URL(`../${file}`, import.meta.url),
      `${extensionDirectory}/${file}`,
    );
  }
  return manifest;
}
