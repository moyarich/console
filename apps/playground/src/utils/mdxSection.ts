import { sentenceCase } from "change-case";
import type { ComponentType } from "react";
import { parsePageMeta, type PageMeta } from "./pageMetadata";

export interface MdxPageModule {
  default: ComponentType;
  meta?: unknown;
}

export interface OrderedDirectory {
  directory: string;
  id: string;
  order: number;
}

export interface MdxSectionPage {
  id: string;
  order: number;
  label: string;
  description?: string;
  meta: PageMeta;
  Page: ComponentType;
}

export interface MdxSectionGroup {
  id: string;
  order: number;
  label: string;
  items: readonly MdxSectionItem[];
}

export type MdxSectionItem =
  | {
      type: "page";
      order: number;
      id: string;
      page: MdxSectionPage;
    }
  | {
      type: "group";
      order: number;
      id: string;
      group: MdxSectionGroup;
    };

export interface MdxSection<TPage extends MdxSectionPage = MdxSectionPage> {
  id: string;
  label: string;
  pages: readonly TPage[];
  items: readonly MdxSectionItem[];
  defaultPage: TPage | undefined;
  getPage: (id: string) => TPage | undefined;
}

interface CreateMdxSectionOptions {
  id: string;
  label: string;
  modules: Record<string, MdxPageModule>;
  defaultPageId?: string;
}

interface MutableMdxSectionGroup {
  id: string;
  order: number;
  label: string;
  items: Map<string, MutableMdxSectionItem>;
}

type MutableMdxSectionItem =
  | {
      type: "page";
      order: number;
      id: string;
      page: MdxSectionPage;
    }
  | {
      type: "group";
      order: number;
      id: string;
      group: MutableMdxSectionGroup;
    };

const ORDERED_DIRECTORY_PATTERN = /^(\d+)-(.+)$/;

export function parseOrderedDirectory(
  directory: string,
  kind = "page",
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

function sortItems(items: Iterable<MutableMdxSectionItem>): MdxSectionItem[] {
  return Array.from(items)
    .sort(
      (left, right) =>
        left.order - right.order || left.id.localeCompare(right.id),
    )
    .map((item) => {
      if (item.type === "page") {
        return item;
      }

      return {
        type: "group" as const,
        order: item.order,
        id: item.id,
        group: {
          id: item.group.id,
          order: item.group.order,
          label: item.group.label,
          items: sortItems(item.group.items.values()),
        },
      };
    });
}

function collectPages(items: readonly MdxSectionItem[]): MdxSectionPage[] {
  return items.flatMap((item) =>
    item.type === "page" ? [item.page] : collectPages(item.group.items),
  );
}

export function createMdxSection({
  id,
  label,
  modules,
  defaultPageId,
}: CreateMdxSectionOptions): MdxSection {
  const root = new Map<string, MutableMdxSectionItem>();

  for (const [path, pageModule] of Object.entries(modules)) {
    const parts = path.replace(/^\.\//, "").split("/");

    if (parts.length < 2 || parts.at(-1) !== "page.mdx") {
      throw new Error(
        `Invalid ${label} page path "${path}". Expected ordered directories ending in page.mdx.`,
      );
    }

    const directories = parts
      .slice(0, -1)
      .map((directory, index, all) =>
        parseOrderedDirectory(
          directory,
          index === all.length - 1 ? `${label} page` : `${label} group`,
        ),
      );
    const pageDirectory = directories.at(-1)!;
    const groupDirectories = directories.slice(0, -1);
    const meta = parsePageMeta(pageModule.meta, path);
    const pageId = directories.map((directory) => directory.id).join("/");
    const page: MdxSectionPage = {
      id: pageId,
      order: pageDirectory.order,
      label: meta.label,
      description: meta.description,
      meta,
      Page: pageModule.default,
    };

    let items = root;
    const ancestry: string[] = [];

    for (const groupDirectory of groupDirectories) {
      ancestry.push(groupDirectory.id);
      const groupId = ancestry.join("/");
      const key = `group:${groupDirectory.id}`;
      const existing = items.get(key);

      if (existing && existing.type !== "group") {
        throw new Error(
          `Invalid ${label} hierarchy: "${groupId}" is both a page and a group.`,
        );
      }

      if (
        existing?.type === "group" &&
        existing.order !== groupDirectory.order
      ) {
        throw new Error(
          `${label} group "${groupId}" uses multiple numeric prefixes.`,
        );
      }

      const group =
        existing?.type === "group"
          ? existing.group
          : {
              id: groupId,
              order: groupDirectory.order,
              label: sentenceCase(groupDirectory.id),
              items: new Map<string, MutableMdxSectionItem>(),
            };

      if (!existing) {
        items.set(key, {
          type: "group",
          id: groupId,
          order: groupDirectory.order,
          group,
        });
      }

      items = group.items;
    }

    const pageKey = `page:${pageDirectory.id}`;

    if (items.has(pageKey)) {
      throw new Error(`Duplicate ${label} page id "${pageId}".`);
    }

    items.set(pageKey, {
      type: "page",
      id: pageId,
      order: page.order,
      page,
    });
  }

  const items = sortItems(root.values());
  const pages = collectPages(items);
  const getPage = (pageId: string) => pages.find((page) => page.id === pageId);

  return {
    id,
    label,
    pages,
    items,
    defaultPage: defaultPageId ? getPage(defaultPageId) : pages[0],
    getPage,
  };
}
