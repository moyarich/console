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
import * as monaco from "monaco-editor";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import {
  defineDefaultWorkerLoaders,
  useWorkerFactory as configureWorkerFactory,
  Worker,
} from "monaco-languageclient/workerFactory";

const extensionFiles = new Map<string, string | URL>([
  [vscodeVisualizeCssColorsBrowserPath, extensionSource],
]);

const typeScriptDefaults = monaco.languages.typescript.typescriptDefaults;

typeScriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ES2020,
  module: monaco.languages.typescript.ModuleKind.ESNext,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
  allowNonTsExtensions: true,
  esModuleInterop: true,
  strict: true,
});

typeScriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
});

function configurePlaygroundWorkers() {
  const typeScriptWorker = () =>
    new Worker(
      new URL(
        "@codingame/monaco-vscode-standalone-typescript-language-features",
        import.meta.url,
      ),
      { type: "module" },
    );

  configureWorkerFactory({
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
