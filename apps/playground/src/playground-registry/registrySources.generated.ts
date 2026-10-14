// Generated from registry.config.ts. Do not edit manually.
import type { MdxPageModule } from "../content/mdxSection";
export const DOCS_MODULES = import.meta.glob(["./**/page.mdx"], { base: "../../../../docs", eager: true }) as Record<string, MdxPageModule>;
export const PACKAGE_MODULES = import.meta.glob(["./*/**/page.mdx", "./addons/*/**/page.mdx"], { base: "../../../../packages", eager: true }) as Record<string, MdxPageModule>;
export const PACKAGE_METADATA = import.meta.glob(["./*/package.json", "./addons/*/package.json"], { base: "../../../../packages", eager: true, import: "default" }) as Record<string, { name: string }>;
