import { writeFileSync } from "node:fs";
import { relative, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import registry from "./registry.config";

/** Emit static import.meta.glob arguments required by Vite. */
export function generateRegistryImports(): void {
  const root = dirname(fileURLToPath(import.meta.url));
  const output = resolve(root, "src/playground-registry/registrySources.generated.ts");
  const relativeBase = (base: string) =>
    relative(dirname(output), resolve(root, base)).split(sep).join("/");
  const glob = (include: readonly string[], base: string, options = "") =>
    `import.meta.glob(${JSON.stringify([...include])}, { base: ${JSON.stringify(relativeBase(base))}, eager: true${options} })`;
  const lines = [
    "// Generated from registry.config.ts. Do not edit manually.",
    'import type { MdxPageModule } from "../content/mdxSection";',
    `export const DOCS_MODULES = ${glob(registry.sources.docs.include, registry.sources.docs.base)} as Record<string, MdxPageModule>;`,
    `export const PACKAGE_MODULES = ${glob(registry.sources.packages.include, registry.sources.packages.base)} as Record<string, MdxPageModule>;`,
    `export const PACKAGE_METADATA = ${glob(registry.sources.packages.metadata, registry.sources.packages.base, ', import: "default"')} as Record<string, { name: string }>;`,
    "",
  ];
  writeFileSync(output, lines.join("\n"));
}
