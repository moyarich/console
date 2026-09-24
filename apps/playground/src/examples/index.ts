import { sentenceCase } from "change-case";
import type { ComponentType } from "react";
import { parseOrderedDirectory, type MdxPageModule } from "../utils/mdxSection";
import { parsePageMeta, type PageMeta } from "../utils/pageMetadata";

export type ConsoleExampleGroupId = string;

export interface ConsoleExampleGroup {
  id: ConsoleExampleGroupId;
  label: string;
  order: number;
  directory: string;
}

export interface ConsoleExample {
  id: string;
  groupId: ConsoleExampleGroupId;
  groupOrder: number;
  order: number;
  label: string;
  description?: string;
  meta: PageMeta;
  Page: ComponentType;
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

const pageModules = import.meta.glob("./*/*/page.mdx", {
  eager: true,
}) as Record<string, MdxPageModule>;

const discoveredExamples = Object.entries(pageModules).map(
  ([path, pageModule]) => ({
    path,
    metadata: parsePageMeta(pageModule.meta, path),
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
  .map(({ metadata, Page, group, example }) => ({
    id: example.id,
    groupId: group.id,
    groupOrder: group.order,
    order: example.order,
    label: metadata.label,
    description: metadata.description,
    meta: metadata,
    Page,
  }))
  .sort(
    (left, right) =>
      left.groupOrder - right.groupOrder ||
      left.order - right.order ||
      left.id.localeCompare(right.id),
  );

export const DEFAULT_CONSOLE_EXAMPLE =
  CONSOLE_EXAMPLES.find((example) => example.id === "current-page") ??
  CONSOLE_EXAMPLES[0]!;
