import type { ComponentType } from "react";

export interface ConsoleExampleMeta {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface ConsoleExample extends ConsoleExampleMeta {
  source: string;
  Component: ComponentType;
}

interface ConsoleExampleModule {
  default: ComponentType;
}

const sourceModules = import.meta.glob("./*/source.tsx", {
  eager: true,
}) as Record<string, ConsoleExampleModule>;

const sourceTextModules = import.meta.glob("./*/source.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const metadataModules = import.meta.glob("./*/meta.json", {
  import: "default",
  eager: true,
}) as Record<string, ConsoleExampleMeta>;

export const CONSOLE_EXAMPLES: readonly ConsoleExample[] = Object.entries(
  metadataModules,
)
  .map(([path, metadata]) => {
    const id = path.split("/").at(-2)!;
    const modulePath = `./${id}/source.tsx`;
    const sourceModule = sourceModules[modulePath];
    const source = sourceTextModules[modulePath];

    if (!sourceModule) {
      throw new Error(`Missing source.tsx module for console example: ${id}`);
    }

    if (!source) {
      throw new Error(`Missing source.tsx text for console example: ${id}`);
    }

    if (metadata.id !== id) {
      throw new Error(`Console example metadata id mismatch: ${id}`);
    }

    return {
      ...metadata,
      source,
      Component: sourceModule.default,
    };
  })
  .sort((a, b) => a.order - b.order);

export const DEFAULT_CONSOLE_EXAMPLE = CONSOLE_EXAMPLES.find(
  (example) => example.id === "current-page",
)!;
