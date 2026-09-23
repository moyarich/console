import * as ConsolePackage from "@moyarich/console";
import * as ImperativeScrollingAddonPackage from "@moyarich/console-addon-imperative-scrolling";
import * as LucideReact from "lucide-react";
import * as React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import type { ComponentType } from "react";

type TypeScriptModule = typeof import("typescript");
type RuntimeModule = Record<string, unknown>;

const RUNTIME_REGISTRY_KEY = "__moyarichConsoleRunnableEsmModules__";
const SUPPORTED_BARE_IMPORTS = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@moyarich/console",
  "@moyarich/console/styles.css",
  "@moyarich/console-addon-imperative-scrolling",
  "lucide-react",
  "typescript",
] as const;

type SupportedBareImport = (typeof SUPPORTED_BARE_IMPORTS)[number];

const bridgeUrls = new Map<SupportedBareImport, string>();

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

function isSupportedBareImport(
  moduleId: string,
): moduleId is SupportedBareImport {
  return (SUPPORTED_BARE_IMPORTS as readonly string[]).includes(moduleId);
}

function getRuntimeModules(ts: TypeScriptModule) {
  return {
    react: React,
    "react/jsx-runtime": JSXRuntime,
    "react/jsx-dev-runtime": JSXRuntime,
    "@moyarich/console": ConsolePackage,
    "@moyarich/console/styles.css": {},
    "@moyarich/console-addon-imperative-scrolling":
      ImperativeScrollingAddonPackage,
    "lucide-react": LucideReact,
    typescript: ts,
  } satisfies Record<SupportedBareImport, RuntimeModule>;
}

function installRuntimeRegistry(ts: TypeScriptModule) {
  const scope = globalThis as typeof globalThis & {
    [RUNTIME_REGISTRY_KEY]?: Record<SupportedBareImport, RuntimeModule>;
  };

  scope[RUNTIME_REGISTRY_KEY] = getRuntimeModules(ts);
}

function isExportableIdentifier(name: string) {
  return /^[A-Za-z_$][\w$]*$/.test(name) && name !== "default";
}

function createRuntimeBridgeUrl(
  moduleId: SupportedBareImport,
  moduleValue: RuntimeModule,
) {
  const cached = bridgeUrls.get(moduleId);

  if (cached) {
    return cached;
  }

  const namedExports = Object.keys(moduleValue)
    .filter(isExportableIdentifier)
    .map(
      (name, index) =>
        `const __export_${index} = runtime[${JSON.stringify(name)}];\nexport { __export_${index} as ${name} };`,
    )
    .join("\n");

  const source = [
    `const registry = globalThis[${JSON.stringify(RUNTIME_REGISTRY_KEY)}];`,
    `const runtime = registry[${JSON.stringify(moduleId)}];`,
    "export default runtime;",
    namedExports,
  ].join("\n");

  const url = URL.createObjectURL(
    new Blob([source], { type: "text/javascript" }),
  );
  bridgeUrls.set(moduleId, url);
  return url;
}

function resolveEsmSpecifier(moduleId: string, ts: TypeScriptModule): string {
  if (isSupportedBareImport(moduleId)) {
    const runtimeModules = getRuntimeModules(ts);
    return createRuntimeBridgeUrl(moduleId, runtimeModules[moduleId]);
  }

  if (
    /^https?:\/\//.test(moduleId) ||
    moduleId.startsWith("data:") ||
    moduleId.startsWith("blob:")
  ) {
    return moduleId;
  }

  if (moduleId.startsWith(".") || moduleId.startsWith("/")) {
    throw new Error(
      `Relative import "${moduleId}" is not supported by the single-file runnable example editor. Use an absolute browser ESM URL instead.`,
    );
  }

  throw new Error(
    `Unsupported bare import "${moduleId}". Runnable examples execute as browser ESM and support ${SUPPORTED_BARE_IMPORTS.join(", ")} plus absolute browser ESM URLs.`,
  );
}

function createEsmSpecifierTransformer(ts: TypeScriptModule) {
  return (context: import("typescript").TransformationContext) => {
    const visit: import("typescript").Visitor = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        return ts.factory.updateImportDeclaration(
          node,
          node.modifiers,
          node.importClause,
          ts.factory.createStringLiteral(
            resolveEsmSpecifier(node.moduleSpecifier.text, ts),
          ),
          node.attributes,
        );
      }

      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        return ts.factory.updateExportDeclaration(
          node,
          node.modifiers,
          node.isTypeOnly,
          node.exportClause,
          ts.factory.createStringLiteral(
            resolveEsmSpecifier(node.moduleSpecifier.text, ts),
          ),
          node.attributes,
        );
      }

      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length >= 1
      ) {
        const argument = node.arguments[0];

        if (argument && ts.isStringLiteralLike(argument)) {
          return ts.factory.updateCallExpression(
            node,
            node.expression,
            node.typeArguments,
            [
              ts.factory.createStringLiteral(
                resolveEsmSpecifier(argument.text, ts),
              ),
              ...node.arguments.slice(1),
            ],
          );
        }
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (rootNode: import("typescript").SourceFile) =>
      ts.visitNode(rootNode, visit) as import("typescript").SourceFile;
  };
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
  installRuntimeRegistry(ts);

  const result = ts.transpileModule(source, {
    fileName: sourceName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
    transformers: {
      // Rewrite emitted imports too, including TypeScript’s automatic JSX runtime.
      after: [createEsmSpecifierTransformer(ts)],
    },
  });

  const errors =
    result.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    ) ?? [];

  if (errors.length) {
    throw new Error(formatDiagnostics(ts, errors));
  }

  const moduleUrl = URL.createObjectURL(
    new Blob(
      [
        result.outputText,
        `\n//# sourceURL=${sourceName.replace(/[\r\n]/g, "")}`,
      ],
      { type: "text/javascript" },
    ),
  );

  try {
    const runtimeModule = await import(/* @vite-ignore */ moduleUrl);
    return findComponent(runtimeModule);
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }
}
