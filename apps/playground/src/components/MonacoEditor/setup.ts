import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TypeScriptWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

type MonacoEnvironment = {
  getWorker(moduleId: string, label: string): Worker;
};

const runtime = globalThis as typeof globalThis & {
  MonacoEnvironment?: MonacoEnvironment;
};

runtime.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === "typescript" || label === "javascript") {
      return new TypeScriptWorker();
    }

    return new EditorWorker();
  },
};

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

loader.config({ monaco });
