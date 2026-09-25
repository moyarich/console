import assert from "node:assert/strict";

export async function prepare({ vscode, sourceFile }) {
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
    {
      uri: document.uri,
      range: colors[0].range,
    },
  );

  assert.ok(
    presentations?.length > 0,
    "The native picker must have color presentations.",
  );
}
