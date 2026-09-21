import type { ComponentType } from "react";

export type ConsoleExampleGroupId = string;

export interface ConsoleExampleGroup {
  id: ConsoleExampleGroupId;
  label: string;
  order: number;
  directory: string;
}

export interface ConsoleExampleMeta {
  label: string;
  description: string;
}

export interface ConsoleExample extends ConsoleExampleMeta {
  id: string;
  groupId: ConsoleExampleGroupId;
  groupOrder: number;
  order: number;
  exampleSource: string;
  Component: ComponentType;
}

interface ConsoleExampleModule {
  default: ComponentType;
}

interface OrderedDirectory {
  directory: string;
  id: string;
  order: number;
}

const ORDERED_DIRECTORY_PATTERN = /^(\d+)-(.+)$/;

function parseOrderedDirectory(
  directory: string,
  kind: "group" | "example",
): OrderedDirectory {
  const match = ORDERED_DIRECTORY_PATTERN.exec(directory);

  if (!match) {
    throw new Error(
      `Invalid ${kind} directory "${directory}". Expected NN-name.`,
    );
  }

  return {
    directory,
    order: Number(match[1]),
    id: match[2]!,
  };
}

function parseExamplePath(path: string) {
  const parts = path.replace(/^\.\//, "").split("/");

  if (parts.length !== 3) {
    throw new Error(
      `Invalid example path "${path}". Expected ./NN-group/NN-example/meta.json.`,
    );
  }

  const [groupDirectory, exampleDirectory] = parts;

  return {
    group: parseOrderedDirectory(groupDirectory!, "group"),
    example: parseOrderedDirectory(exampleDirectory!, "example"),
  };
}

function labelFromId(id: string) {
  const label = id.replace(/-/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const playgroundModules = import.meta.glob("./*/*/source.tsx", {
  eager: true,
}) as Record<string, ConsoleExampleModule>;

const exampleSourceModules = import.meta.glob("./*/*/example.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const metadataModules = import.meta.glob("./*/*/meta.json", {
  import: "default",
  eager: true,
}) as Record<string, ConsoleExampleMeta>;

const discoveredExamples = Object.entries(metadataModules).map(
  ([path, metadata]) => ({
    path,
    metadata,
    ...parseExamplePath(path),
  }),
);

const groupsById = new Map<ConsoleExampleGroupId, ConsoleExampleGroup>();

for (const { group } of discoveredExamples) {
  const existing = groupsById.get(group.id);

  if (existing && existing.order !== group.order) {
    throw new Error(
      `Example group "${group.id}" uses multiple numeric prefixes.`,
    );
  }

  groupsById.set(group.id, {
    id: group.id,
    label: labelFromId(group.id),
    order: group.order,
    directory: group.directory,
  });
}

export const CONSOLE_EXAMPLE_GROUPS: readonly ConsoleExampleGroup[] =
  Array.from(groupsById.values()).sort(
    (left, right) =>
      left.order - right.order || left.id.localeCompare(right.id),
  );

export const CONSOLE_EXAMPLES: readonly ConsoleExample[] = discoveredExamples
  .map(({ metadata, group, example }) => {
    const playgroundPath = `./${group.directory}/${example.directory}/source.tsx`;
    const examplePath = `./${group.directory}/${example.directory}/example.tsx`;
    const playgroundModule = playgroundModules[playgroundPath];
    const exampleSource = exampleSourceModules[examplePath];

    if (!playgroundModule) {
      throw new Error(
        `Missing source.tsx playground harness: ${group.directory}/${example.directory}`,
      );
    }

    if (!exampleSource) {
      throw new Error(
        `Missing example.tsx consumer example: ${group.directory}/${example.directory}`,
      );
    }

    return {
      ...metadata,
      id: example.id,
      groupId: group.id,
      groupOrder: group.order,
      order: example.order,
      exampleSource,
      Component: playgroundModule.default,
    };
  })
  .sort(
    (left, right) =>
      left.groupOrder - right.groupOrder ||
      left.order - right.order ||
      left.id.localeCompare(right.id),
  );

export const DEFAULT_CONSOLE_EXAMPLE =
  CONSOLE_EXAMPLES.find((example) => example.id === "current-page") ??
  CONSOLE_EXAMPLES[0]!;
