import type { ComponentType } from "react";

export interface ConsoleExampleMeta {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface ConsoleExampleSourceFile {
  name: string;
  source: string;
}

export interface ConsoleExample extends ConsoleExampleMeta {
  sourceFiles: readonly ConsoleExampleSourceFile[];
  Component: ComponentType;
}

interface ConsoleExampleModule {
  default: ComponentType;
}

const playgroundModules = import.meta.glob("./*/source.tsx", {
  eager: true,
}) as Record<string, ConsoleExampleModule>;

const consumerSourceModules = import.meta.glob(
  ["./*/example.tsx", "./*/sender.ts", "./*/sender.tsx", "./*/socket.ts"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const metadataModules = import.meta.glob("./*/meta.json", {
  import: "default",
  eager: true,
}) as Record<string, ConsoleExampleMeta>;

const SOURCE_FILE_ORDER = ["example.tsx", "sender.ts", "sender.tsx", "socket.ts"];

export const CONSOLE_EXAMPLES: readonly ConsoleExample[] = Object.entries(
  metadataModules,
)
  .map(([path, metadata]) => {
    const id = path.split("/").at(-2)!;
    const playgroundPath = "./" + id + "/source.tsx";
    const playgroundModule = playgroundModules[playgroundPath];

    if (!playgroundModule) {
      throw new Error("Missing source.tsx playground harness: " + id);
    }

    if (metadata.id !== id) {
      throw new Error("Console example metadata id mismatch: " + id);
    }

    const sourceFiles = SOURCE_FILE_ORDER.flatMap((name) => {
      const source = consumerSourceModules["./" + id + "/" + name];
      return source ? [{ name, source }] : [];
    });

    if (!sourceFiles.length) {
      throw new Error("Missing consumer example source: " + id);
    }

    return {
      ...metadata,
      sourceFiles,
      Component: playgroundModule.default,
    };
  })
  .sort((a, b) => a.order - b.order);

export const DEFAULT_CONSOLE_EXAMPLE = CONSOLE_EXAMPLES.find(
  (example) => example.id === "current-page",
)!;
