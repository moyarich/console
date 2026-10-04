import "@codingame/monaco-vscode-standalone-css-language-features";
import "@codingame/monaco-vscode-standalone-html-language-features";
import "@codingame/monaco-vscode-standalone-json-language-features";
import "@codingame/monaco-vscode-standalone-languages";
import {
  JsxEmit,
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget,
  typescriptDefaults,
} from "@codingame/monaco-vscode-standalone-typescript-language-features";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import getLanguagesServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import {
  defineDefaultWorkerLoaders,
  useWorkerFactory as configureWorkerFactory,
  Worker,
} from "monaco-languageclient/workerFactory";

typescriptDefaults.setCompilerOptions({
  target: ScriptTarget.ES2020,
  module: ModuleKind.ESNext,
  moduleResolution: ModuleResolutionKind.NodeJs,
  jsx: JsxEmit.ReactJSX,
  allowNonTsExtensions: true,
  esModuleInterop: true,
  strict: true,
});

typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
});

function configurePlaygroundWorkers() {
  const typeScriptWorker = () =>
    new Worker(
      new URL(
        "@codingame/monaco-vscode-standalone-typescript-language-features/worker",
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
            "@codingame/monaco-vscode-standalone-css-language-features/worker",
            import.meta.url,
          ),
          { type: "module" },
        ),
      html: () =>
        new Worker(
          new URL(
            "@codingame/monaco-vscode-standalone-html-language-features/worker",
            import.meta.url,
          ),
          { type: "module" },
        ),
      json: () =>
        new Worker(
          new URL(
            "@codingame/monaco-vscode-standalone-json-language-features/worker",
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
  // Keep Monaco's lightweight language tokenization and themes.
  $type: "classic",
  viewsConfig: {
    $type: "EditorService",
  },
  serviceOverrides: {
    ...getKeybindingsServiceOverride(),
    ...getLanguagesServiceOverride(),
  },
  userConfiguration: {
    json: JSON.stringify({
      "editor.colorDecorators": true,
    }),
  },
  monacoWorkerFactory: configurePlaygroundWorkers,
};
