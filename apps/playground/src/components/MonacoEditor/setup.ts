import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
import extensionSource from "@moyarich/vscode-visualize-css-colors/extension-source";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";

const extensionFiles = new Map<string, string | URL>([
  [vscodeVisualizeCssColorsBrowserPath, extensionSource],
]);

export const vscodeApiConfig: MonacoVscodeApiConfig = {
  $type: "extended",
  viewsConfig: {
    $type: "EditorService",
  },
  userConfiguration: {
    json: JSON.stringify({
      "editor.colorDecorators": true,
    }),
  },
  extensions: [
    {
      config: vscodeVisualizeCssColorsManifest,
      filesOrContents: extensionFiles,
    },
  ],
  monacoWorkerFactory: configureDefaultWorkerFactory,
};
