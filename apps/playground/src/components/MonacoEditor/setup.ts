import "@codingame/monaco-vscode-css-default-extension";
import "@codingame/monaco-vscode-css-language-features-default-extension";
import "@codingame/monaco-vscode-html-default-extension";
import "@codingame/monaco-vscode-html-language-features-default-extension";
import "@codingame/monaco-vscode-javascript-default-extension";
import "@codingame/monaco-vscode-json-default-extension";
import "@codingame/monaco-vscode-json-language-features-default-extension";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import "@codingame/monaco-vscode-typescript-basics-default-extension";
import "@codingame/monaco-vscode-typescript-language-features-default-extension";
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
  serviceOverrides: {
    ...getKeybindingsServiceOverride(),
  },
  userConfiguration: {
    json: JSON.stringify({
      "editor.colorDecorators": true,

      // Preserve the inferred TypeScript project behavior that the previous
      // @monaco-editor/react setup configured through typescriptDefaults.
      "js/ts.implicitProjectConfig.target": "ES2020",
      "js/ts.implicitProjectConfig.module": "ESNext",
      "js/ts.implicitProjectConfig.strict": true,
      "typescript.tsserver.web.projectWideIntellisense.enabled": true,
      "typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors":
        true,

      // Make VS Code's built-in formatters the explicit defaults for the
      // languages used by runnable playground projects.
      "[javascript]": {
        "editor.defaultFormatter": "vscode.typescript-language-features",
      },
      "[javascriptreact]": {
        "editor.defaultFormatter": "vscode.typescript-language-features",
      },
      "[typescript]": {
        "editor.defaultFormatter": "vscode.typescript-language-features",
      },
      "[typescriptreact]": {
        "editor.defaultFormatter": "vscode.typescript-language-features",
      },
      "[css]": {
        "editor.defaultFormatter": "vscode.css-language-features",
      },
      "[scss]": {
        "editor.defaultFormatter": "vscode.css-language-features",
      },
      "[less]": {
        "editor.defaultFormatter": "vscode.css-language-features",
      },
      "[json]": {
        "editor.defaultFormatter": "vscode.json-language-features",
      },
      "[jsonc]": {
        "editor.defaultFormatter": "vscode.json-language-features",
      },
      "[html]": {
        "editor.defaultFormatter": "vscode.html-language-features",
      },
    }),
  },
  extensions: [
    {
      config: vscodeVisualizeCssColorsManifest,
      filesOrContents: extensionFiles,
    },
  ],
  advanced: {
    enableExtHostWorker: true,
  },
  monacoWorkerFactory: configureDefaultWorkerFactory,
};
