/* eslint-disable @typescript-eslint/no-require-imports -- VS Code loads this test entry through CommonJS. */
const assert = require("node:assert/strict");
const { access } = require("node:fs/promises");
const vscode = require("vscode");

exports.run = async function run() {
  const completionFile = process.env.EXTENSION_DEMO_COMPLETION_FILE;
  const sourceFile = process.env.EXTENSION_DEMO_SOURCE_FILE;
  assert.ok(completionFile && sourceFile, "Demo paths are required.");
  const extension = vscode.extensions.getExtension(
    "moyarich.visualize-css-colors",
  );
  assert.ok(extension, "The packaged color extension must be loaded.");
  await extension.activate();
  const document = await vscode.workspace.openTextDocument(
    vscode.Uri.file(sourceFile),
  );
  await vscode.window.showTextDocument(document);
  const colors = await vscode.commands.executeCommand(
    "vscode.executeDocumentColorProvider",
    document.uri,
  );
  assert.ok(
    colors?.length > 0,
    "The color provider must return colors for the demo.",
  );
  const presentations = await vscode.commands.executeCommand(
    "vscode.executeColorPresentationProvider",
    colors[0].color,
    { uri: document.uri, range: colors[0].range },
  );
  assert.ok(
    presentations?.length > 0,
    "The native picker must have color presentations.",
  );
  const deadline =
    process.env.EXTENSION_DEMO_CODEGEN === "1" ? Infinity : Date.now() + 120000;
  while (Date.now() < deadline) {
    try {
      await access(completionFile);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Timed out waiting for the color demo recorder.");
};
