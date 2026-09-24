import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
// @ts-expect-error -- Vite resolves the exported extension bundle as a build-time asset URL.
import extensionUrl from "@moyarich/vscode-visualize-css-colors/extension.js?url";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";

const extensionFiles = new Map<string, string | URL>([
  [
    vscodeVisualizeCssColorsBrowserPath,
    new URL(extensionUrl, window.location.href),
  ],
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
