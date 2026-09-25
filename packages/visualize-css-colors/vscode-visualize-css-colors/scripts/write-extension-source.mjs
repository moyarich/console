import { readFile, writeFile } from "node:fs/promises";

const extensionUrl = new URL("../dist/extension.cjs", import.meta.url);
const sourceModuleUrl = new URL("../dist/extension-source.js", import.meta.url);
const sourceTypesUrl = new URL(
  "../dist/extension-source.d.ts",
  import.meta.url,
);

const extensionSource = await readFile(extensionUrl, "utf8");

await Promise.all([
  writeFile(
    sourceModuleUrl,
    `const extensionSource = ${JSON.stringify(
      extensionSource,
    )};\n\nexport default extensionSource;\n`,
  ),
  writeFile(
    sourceTypesUrl,
    "declare const extensionSource: string;\n\nexport default extensionSource;\n",
  ),
]);
