import * as ConsolePackage from "@moyarich/console";
import * as ConsoleCorePackage from "@moyarich/console-core";
import * as DataExportAddonPackage from "@moyarich/console-addon-data-export";
import * as DiagnosticsAddonPackage from "@moyarich/console-addon-diagnostics";
import * as ImperativeScrollingAddonPackage from "@moyarich/console-addon-imperative-scrolling";
import * as LucideReact from "lucide-react";
import * as React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import type { ElementType } from "react";

type TypeScriptModule = typeof import("typescript");
type RuntimeModule = unknown;

export interface CompileExampleProjectOptions {
  entryPath: string;
  files: Readonly<Record<string, string>>;
  runtimeModules?: Readonly<Record<string, RuntimeModule>>;
}

export interface CompiledExampleRuntime {
  Component: ElementType;
  dispose(): void;
}

const SCRIPT_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
] as const;
const RESOLVABLE_EXTENSIONS = [...SCRIPT_EXTENSIONS, ".json", ".css"] as const;

const DEFAULT_RUNTIME_MODULES: Readonly<Record<string, RuntimeModule>> = {
  react: React,
  "react/jsx-runtime": JSXRuntime,
  "react/jsx-dev-runtime": JSXRuntime,
  "@moyarich/console": ConsolePackage,
  "@moyarich/console-core": ConsoleCorePackage,
  "@moyarich/console/styles.css": {},
  "@moyarich/console-addon-data-export": DataExportAddonPackage,
  "@moyarich/console-addon-diagnostics": DiagnosticsAddonPackage,
  "@moyarich/console-addon-imperative-scrolling":
    ImperativeScrollingAddonPackage,
  "lucide-react": LucideReact,
};

interface LocalResolution {
  path: string;
  raw: boolean;
}

interface ModuleRecord {
  exports: unknown;
}

function normalizeVirtualPath(path: string): string {
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//, "");
  const segments: string[] = [];

  for (const segment of normalized.split("/")) {
    if (!segment || segment === ".") continue;

    if (segment === "..") {
      if (segments.length === 0) {
        throw new Error(
          'Virtual path "' + path + '" escapes the runnable project.',
        );
      }
      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  if (segments.length === 0) {
    throw new Error('Virtual path "' + path + '" does not identify a file.');
  }

  return segments.join("/");
}

function directoryName(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function joinVirtualPath(base: string, specifier: string): string {
  return normalizeVirtualPath(base ? base + "/" + specifier : specifier);
}

function splitLocalSpecifier(specifier: string) {
  const queryIndex = specifier.indexOf("?");
  const hashIndex = specifier.indexOf("#");
  const suffixIndex = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (suffixIndex === undefined) {
    return { path: specifier, query: "" };
  }

  return {
    path: specifier.slice(0, suffixIndex),
    query: specifier.slice(suffixIndex),
  };
}

function isAbsoluteBrowserModule(specifier: string) {
  return (
    /^https?:\/\//.test(specifier) ||
    specifier.startsWith("data:") ||
    specifier.startsWith("blob:")
  );
}

function hasKnownExtension(path: string) {
  return RESOLVABLE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function resolveLocalSpecifier(
  specifier: string,
  importerPath: string,
  files: ReadonlyMap<string, string>,
): LocalResolution {
  const { path: sourcePath, query } = splitLocalSpecifier(specifier);
  const raw = query === "?raw";

  if (query && !raw) {
    throw new Error(
      'Unsupported local import query "' +
        query +
        '" in "' +
        specifier +
        '". Only ?raw is supported.',
    );
  }

  const importerDirectory = directoryName(importerPath);
  const requestedPath = sourcePath.startsWith("/")
    ? normalizeVirtualPath(sourcePath.slice(1))
    : joinVirtualPath(importerDirectory, sourcePath);

  const candidates = [requestedPath];

  if (!hasKnownExtension(requestedPath)) {
    for (const extension of RESOLVABLE_EXTENSIONS) {
      candidates.push(requestedPath + extension);
    }

    for (const extension of RESOLVABLE_EXTENSIONS) {
      candidates.push(requestedPath + "/index" + extension);
    }
  }

  const path = candidates.find((candidate) => files.has(candidate));

  if (!path) {
    throw new Error(
      [
        'Unable to resolve "' + specifier + '" from "' + importerPath + '".',
        "Available runnable files:",
        ...Array.from(files.keys(), (file) => "- " + file),
      ].join("\n"),
    );
  }

  return { path, raw };
}

function normalizeProjectFiles(
  files: Readonly<Record<string, string>>,
): ReadonlyMap<string, string> {
  const normalized = new Map<string, string>();

  for (const [path, source] of Object.entries(files)) {
    const normalizedPath = normalizeVirtualPath(path);

    if (normalized.has(normalizedPath)) {
      throw new Error('Duplicate runnable file "' + normalizedPath + '".');
    }

    normalized.set(normalizedPath, source);
  }

  return normalized;
}

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

      return (
        diagnostic.file.fileName +
        ":" +
        (position.line + 1) +
        ":" +
        (position.character + 1) +
        " " +
        message
      );
    })
    .join("\n");
}

function createDynamicImportTransformer(ts: TypeScriptModule) {
  return (context: import("typescript").TransformationContext) => {
    const visit: import("typescript").Visitor = (node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        return ts.factory.createCallExpression(
          ts.factory.createIdentifier("__importDynamic"),
          undefined,
          node.arguments,
        );
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (rootNode: import("typescript").SourceFile) =>
      ts.visitNode(rootNode, visit) as import("typescript").SourceFile;
  };
}

function collectStaticExternalSpecifiers(
  ts: TypeScriptModule,
  source: string,
  sourcePath: string,
) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    sourcePath.endsWith(".tsx") || sourcePath.endsWith(".jsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS,
  );
  const specifiers = new Set<string>();

  const visit = (node: import("typescript").Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      isAbsoluteBrowserModule(node.moduleSpecifier.text)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function transpileModule(
  ts: TypeScriptModule,
  source: string,
  sourcePath: string,
) {
  const result = ts.transpileModule(source, {
    fileName: sourcePath,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
    },
    transformers: {
      before: [createDynamicImportTransformer(ts)],
    },
  });

  const errors =
    result.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    ) ?? [];

  if (errors.length) {
    throw new Error(formatDiagnostics(ts, errors));
  }

  return (
    result.outputText +
    "\n//# sourceURL=runnable:///" +
    sourcePath.replace(/[\r\n]/g, "")
  );
}

function toModuleNamespace(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "__esModule" in value &&
    (value as { __esModule?: unknown }).__esModule
  ) {
    return value;
  }

  if (value && (typeof value === "object" || typeof value === "function")) {
    return {
      default: value,
      ...(typeof value === "object" ? value : {}),
    };
  }

  return { default: value };
}

function isRenderableComponent(value: unknown): value is ElementType {
  if (typeof value === "function" || typeof value === "string") {
    return true;
  }

  return typeof value === "object" && value !== null && "$$typeof" in value;
}

function findComponent(exportsValue: unknown): ElementType {
  if (isRenderableComponent(exportsValue)) {
    return exportsValue;
  }

  if (!exportsValue || typeof exportsValue !== "object") {
    throw new Error(
      "The runnable entry module did not export a React component.",
    );
  }

  const exportsRecord = exportsValue as Record<string, unknown>;

  if (isRenderableComponent(exportsRecord.default)) {
    return exportsRecord.default;
  }

  const namedComponent = Object.entries(exportsRecord).find(
    ([name, value]) => /^[A-Z]/.test(name) && isRenderableComponent(value),
  );

  if (namedComponent) {
    return namedComponent[1] as ElementType;
  }

  throw new Error(
    "Export a default React component or a named component whose name starts with a capital letter.",
  );
}

export async function compileExampleProject({
  entryPath,
  files,
  runtimeModules = {},
}: CompileExampleProjectOptions): Promise<CompiledExampleRuntime> {
  const ts = await import("typescript");
  const normalizedFiles = normalizeProjectFiles(files);
  const normalizedEntryPath = normalizeVirtualPath(entryPath);

  if (!normalizedFiles.has(normalizedEntryPath)) {
    throw new Error(
      'Runnable entry "' +
        normalizedEntryPath +
        '" is not present in the project files.',
    );
  }

  const modules = new Map<string, RuntimeModule>([
    ...Object.entries(DEFAULT_RUNTIME_MODULES),
    ...Object.entries(runtimeModules),
  ]);
  const transpiled = new Map<string, string>();
  const externalSpecifiers = new Set<string>();

  for (const [path, source] of normalizedFiles) {
    if (SCRIPT_EXTENSIONS.some((extension) => path.endsWith(extension))) {
      transpiled.set(path, transpileModule(ts, source, path));

      for (const specifier of collectStaticExternalSpecifiers(
        ts,
        source,
        path,
      )) {
        externalSpecifiers.add(specifier);
      }
    }
  }

  await Promise.all(
    Array.from(externalSpecifiers, async (specifier) => {
      const moduleValue = await import(/* @vite-ignore */ specifier);
      modules.set(specifier, moduleValue);
    }),
  );

  const cache = new Map<string, ModuleRecord>();
  const styles = new Map<string, HTMLStyleElement>();
  let disposed = false;

  const assertActive = () => {
    if (disposed) {
      throw new Error("Runnable runtime has been disposed.");
    }
  };

  const installStyle = (path: string, source: string) => {
    assertActive();
    if (styles.has(path) || typeof document === "undefined") {
      return {};
    }

    const style = document.createElement("style");
    style.dataset.runnableSource = path;
    style.textContent = source;
    document.head.appendChild(style);
    styles.set(path, style);
    return {};
  };

  const executeModule = (path: string): unknown => {
    assertActive();

    const cached = cache.get(path);

    if (cached) {
      return cached.exports;
    }

    const source = normalizedFiles.get(path);

    if (source === undefined) {
      throw new Error('Runnable file "' + path + '" is missing.');
    }

    if (path.endsWith(".json")) {
      const value = JSON.parse(source) as unknown;
      cache.set(path, { exports: value });
      return value;
    }

    if (path.endsWith(".css")) {
      const value = installStyle(path, source);
      cache.set(path, { exports: value });
      return value;
    }

    const compiled = transpiled.get(path);

    if (!compiled) {
      throw new Error(
        'Runnable file "' + path + '" has an unsupported extension.',
      );
    }

    const moduleRecord: ModuleRecord = {
      exports: {},
    };
    cache.set(path, moduleRecord);

    const requireModule = (specifier: string): unknown => {
      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        const resolution = resolveLocalSpecifier(
          specifier,
          path,
          normalizedFiles,
        );

        if (resolution.raw) {
          return normalizedFiles.get(resolution.path);
        }

        return executeModule(resolution.path);
      }

      if (modules.has(specifier)) {
        return modules.get(specifier);
      }

      throw new Error(
        'Unsupported runtime import "' +
          specifier +
          '" in "' +
          path +
          '". Provide it through runtimeModules or use a relative project import.',
      );
    };

    const importModule = async (specifier: string): Promise<unknown> => {
      assertActive();

      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        const resolution = resolveLocalSpecifier(
          specifier,
          path,
          normalizedFiles,
        );

        if (resolution.raw) {
          return { default: normalizedFiles.get(resolution.path) };
        }

        return toModuleNamespace(executeModule(resolution.path));
      }

      if (modules.has(specifier)) {
        return toModuleNamespace(modules.get(specifier));
      }

      if (isAbsoluteBrowserModule(specifier)) {
        return import(/* @vite-ignore */ specifier);
      }

      throw new Error(
        'Unsupported dynamic import "' +
          specifier +
          '" in "' +
          path +
          '". Provide it through runtimeModules, use a relative project import, or use an absolute browser ESM URL.',
      );
    };

    try {
      const evaluator = new Function(
        "require",
        "module",
        "exports",
        "__importDynamic",
        compiled,
      ) as (
        require: (specifier: string) => unknown,
        module: ModuleRecord,
        exports: unknown,
        importDynamic: (specifier: string) => Promise<unknown>,
      ) => void;

      evaluator(
        requireModule,
        moduleRecord,
        moduleRecord.exports,
        importModule,
      );
      return moduleRecord.exports;
    } catch (error) {
      cache.delete(path);
      throw error;
    }
  };

  try {
    const exportsValue = executeModule(normalizedEntryPath);
    const Component = findComponent(exportsValue);

    return {
      Component,
      dispose() {
        if (disposed) return;
        disposed = true;

        for (const style of styles.values()) {
          style.remove();
        }
        styles.clear();
        cache.clear();
      },
    };
  } catch (error) {
    for (const style of styles.values()) {
      style.remove();
    }
    throw error;
  }
}
