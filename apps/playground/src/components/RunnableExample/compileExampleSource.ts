import * as ConsolePackage from "@moyarich/console";
import * as React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import type { ComponentType } from "react";

type TypeScriptModule = typeof import("typescript");

function formatDiagnostics(
  ts: TypeScriptModule,
  diagnostics: readonly import("typescript").Diagnostic[],
) {
  return diagnostics
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );

      if (!diagnostic.file || diagnostic.start === undefined) {
        return message;
      }

      const position = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );

      return `${position.line + 1}:${position.character + 1} ${message}`;
    })
    .join("\n");
}

function resolveRuntimeModule(moduleId: string, ts: TypeScriptModule) {
  switch (moduleId) {
    case "react":
      return React;
    case "react/jsx-runtime":
    case "react/jsx-dev-runtime":
      return JSXRuntime;
    case "@moyarich/console":
      return ConsolePackage;
    case "@moyarich/console/styles.css":
      return {};
    case "typescript":
      return ts;
    default:
      throw new Error(
        `Unsupported import "${moduleId}". Runnable examples currently support React, TypeScript, and @moyarich/console imports.`,
      );
  }
}

function findComponent(exportsValue: unknown): ComponentType {
  if (typeof exportsValue === "function") {
    return exportsValue as ComponentType;
  }

  if (!exportsValue || typeof exportsValue !== "object") {
    throw new Error("The example did not export a React component.");
  }

  const exportsRecord = exportsValue as Record<string, unknown>;

  if (typeof exportsRecord.default === "function") {
    return exportsRecord.default as ComponentType;
  }

  const namedComponent = Object.entries(exportsRecord).find(
    ([name, value]) => /^[A-Z]/.test(name) && typeof value === "function",
  );

  if (namedComponent) {
    return namedComponent[1] as ComponentType;
  }

  throw new Error(
    "Export a default React component or a named component whose name starts with a capital letter.",
  );
}

export async function compileExampleSource(
  source: string,
  sourceName: string,
): Promise<ComponentType> {
  const ts = await import("typescript");

  const result = ts.transpileModule(source, {
    fileName: sourceName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  });

  const errors =
    result.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    ) ?? [];

  if (errors.length) {
    throw new Error(formatDiagnostics(ts, errors));
  }

  const runtimeModule: { exports: unknown } = { exports: {} };
  const execute = new Function(
    "require",
    "module",
    "exports",
    `${result.outputText}\n//# sourceURL=${sourceName}`,
  );

  execute(
    (moduleId: string) => resolveRuntimeModule(moduleId, ts),
    runtimeModule,
    runtimeModule.exports,
  );

  return findComponent(runtimeModule.exports);
}
