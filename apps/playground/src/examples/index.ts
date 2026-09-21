import type { ComponentType } from "react";

export const CONSOLE_EXAMPLE_GROUPS = [
  { id: "getting-started", label: "Getting started" },
  { id: "events", label: "Events" },
  { id: "console-methods", label: "Console methods" },
  { id: "transports", label: "Transports" },
] as const;

export type ConsoleExampleGroupId =
  (typeof CONSOLE_EXAMPLE_GROUPS)[number]["id"];

export const DEFAULT_CONSOLE_EXAMPLE_GROUP_ID: ConsoleExampleGroupId =
  "console-methods";

export interface ConsoleExampleMeta {
  id: string;
  label: string;
  description: string;
  order: number;
  groupId?: ConsoleExampleGroupId;
}

export interface ConsoleExample extends ConsoleExampleMeta {
  groupId: ConsoleExampleGroupId;
  exampleSource: string;
  Component: ComponentType;
}

interface ConsoleExampleModule {
  default: ComponentType;
}

const playgroundModules = import.meta.glob("./*/source.tsx", {
  eager: true,
}) as Record<string, ConsoleExampleModule>;

const exampleSourceModules = import.meta.glob("./*/example.tsx", {
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
    const playgroundPath = "./" + id + "/source.tsx";
    const examplePath = "./" + id + "/example.tsx";
    const playgroundModule = playgroundModules[playgroundPath];
    const exampleSource = exampleSourceModules[examplePath];

    if (!playgroundModule) {
      throw new Error("Missing source.tsx playground harness: " + id);
    }

    if (!exampleSource) {
      throw new Error("Missing example.tsx consumer example: " + id);
    }

    if (metadata.id !== id) {
      throw new Error("Console example metadata id mismatch: " + id);
    }

    return {
      ...metadata,
      groupId: metadata.groupId ?? DEFAULT_CONSOLE_EXAMPLE_GROUP_ID,
      exampleSource,
      Component: playgroundModule.default,
    };
  })
  .sort((a, b) => a.order - b.order);

export const DEFAULT_CONSOLE_EXAMPLE =
  CONSOLE_EXAMPLES.find((example) => example.id === "current-page") ??
  CONSOLE_EXAMPLES[0]!;
