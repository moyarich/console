import {
  cssDefaults,
  lessDefaults,
  scssDefaults,
} from "@codingame/monaco-vscode-standalone-css-language-features";
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
import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
import extensionSource from "@moyarich/vscode-visualize-css-colors/extension-source";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import {
  defineDefaultWorkerLoaders,
  useWorkerFactory as configureWorkerFactory,
  Worker,
} from "monaco-languageclient/workerFactory";

const extensionFiles = new Map<string, string | URL>([
  [vscodeVisualizeCssColorsBrowserPath, extensionSource],
]);

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

// Keep Monaco's CSS completions, validation, and formatting, but leave color
// detection to @moyarich/vscode-visualize-css-colors.
for (const defaults of [cssDefaults, scssDefaults, lessDefaults]) {
  defaults.setModeConfiguration({
    ...defaults.modeConfiguration,
    colors: false,
  });
}

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
  // Classic controls tokenization, not extension support: the VS Code extension
  // host below still runs our DocumentColorProvider. Keep Monaco's Monarch
  // language tokenization and themes.
  // Extended mode replaces them with VS Code TextMate/theme services, which
  // require separate grammar and theme extensions.
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
  extensions: [
    /*     {
      config: vscodeVisualizeCssColorsManifest,
      filesOrContents: extensionFiles,
    }, */
  ],
  monacoWorkerFactory: configurePlaygroundWorkers,
};
