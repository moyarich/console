import { sentenceCase } from "change-case";
import type { ComponentType } from "react";
import {
  parseConsoleExampleMeta,
  type ConsoleExampleMeta,
} from "./exampleMetadata";

export type { ConsoleExampleMeta } from "./exampleMetadata";

export type ConsoleExampleGroupId = string;

export interface ConsoleExampleGroup {
  id: ConsoleExampleGroupId;
  label: string;
  order: number;
  directory: string;
}

export interface ConsoleExample extends ConsoleExampleMeta {
  id: string;
  groupId: ConsoleExampleGroupId;
  groupOrder: number;
  order: number;
  exampleSource: string;
  Component: ComponentType;
  Page: ComponentType;
}

interface ConsoleExampleModule {
  default: ComponentType;
}

interface ConsoleExamplePageModule {
  default: ComponentType;
  meta?: unknown;
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
      `Invalid example path "${path}". Expected ./NN-group/NN-example/page.mdx.`,
    );
  }

  const [groupDirectory, exampleDirectory] = parts;

  return {
    group: parseOrderedDirectory(groupDirectory!, "group"),
    example: parseOrderedDirectory(exampleDirectory!, "example"),
  };
}

const playgroundModules = import.meta.glob("./*/*/index.tsx", {
  eager: true,
}) as Record<string, ConsoleExampleModule>;

const exampleSourceModules = import.meta.glob("./*/*/example.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const pageModules = import.meta.glob("./*/*/page.mdx", {
  eager: true,
}) as Record<string, ConsoleExamplePageModule>;

const discoveredExamples = Object.entries(pageModules).map(
  ([path, pageModule]) => ({
    path,
    metadata: parseConsoleExampleMeta(pageModule.meta, path),
    Page: pageModule.default,
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
    label: sentenceCase(group.id),
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
  .map(({ metadata, Page, group, example }) => {
    const playgroundPath = `./${group.directory}/${example.directory}/index.tsx`;
    const examplePath = `./${group.directory}/${example.directory}/example.tsx`;
    const playgroundModule = playgroundModules[playgroundPath];
    const exampleSource = exampleSourceModules[examplePath];

    if (!playgroundModule) {
      throw new Error(
        `Missing index.tsx playground harness: ${group.directory}/${example.directory}`,
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
      Page,
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
