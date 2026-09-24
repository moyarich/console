import "@codingame/monaco-vscode-standalone-css-language-features";
import "@codingame/monaco-vscode-standalone-html-language-features";
import "@codingame/monaco-vscode-standalone-json-language-features";
import "@codingame/monaco-vscode-standalone-languages";
import "@codingame/monaco-vscode-standalone-typescript-language-features";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
import extensionSource from "@moyarich/vscode-visualize-css-colors/extension-source";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import {
  defineDefaultWorkerLoaders,
  useWorkerFactory,
  Worker,
} from "monaco-languageclient/workerFactory";

const extensionFiles = new Map<string, string | URL>([
  [vscodeVisualizeCssColorsBrowserPath, extensionSource],
]);

function configurePlaygroundWorkers() {
  const typeScriptWorker = () =>
    new Worker(
      new URL(
        "@codingame/monaco-vscode-standalone-typescript-language-features",
        import.meta.url,
      ),
      { type: "module" },
    );

  useWorkerFactory({
    workerLoaders: {
      ...defineDefaultWorkerLoaders(),
      css: () =>
        new Worker(
          new URL(
            "@codingame/monaco-vscode-standalone-css-language-features",
            import.meta.url,
          ),
          { type: "module" },
        ),
      html: () =>
        new Worker(
          new URL(
            "@codingame/monaco-vscode-standalone-html-language-features",
            import.meta.url,
          ),
          { type: "module" },
        ),
      json: () =>
        new Worker(
          new URL(
            "@codingame/monaco-vscode-standalone-json-language-features",
            import.meta.url,
          ),
          { type: "module" },
        ),
      javascript: typeScriptWorker,
      typescript: typeScriptWorker,
    },
  });
}

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

      // Mirror the inferred TypeScript project behavior from the previous
      // @monaco-editor/react setup.
      "js/ts.implicitProjectConfig.target": "ES2020",
      "js/ts.implicitProjectConfig.module": "ESNext",
      "js/ts.implicitProjectConfig.strict": true,

      // Keep semantic diagnostics disabled, matching main's
      // typescriptDefaults.setDiagnosticsOptions configuration.
      "typescript.tsserver.web.projectWideIntellisense.enabled": true,
      "typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors":
        true,
    }),
  },
  extensions: [
    {
      config: vscodeVisualizeCssColorsManifest,
      filesOrContents: extensionFiles,
    },
  ],
  monacoWorkerFactory: configurePlaygroundWorkers,
};
