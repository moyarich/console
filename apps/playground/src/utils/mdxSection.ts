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
  groupId?: string;
  meta: PageMeta;
  Page: ComponentType;
}

export interface MdxSectionGroup {
  id: string;
  order: number;
  label: string;
  pages: readonly MdxSectionPage[];
}

export type MdxSectionItem =
  | {
      type: "page";
      order: number;
      page: MdxSectionPage;
    }
  | {
      type: "group";
      order: number;
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

export function createMdxSection({
  id,
  label,
  modules,
  defaultPageId,
}: CreateMdxSectionOptions): MdxSection {
  const flatPages: MdxSectionPage[] = [];
  const groupedPages = new Map<
    string,
    {
      group: OrderedDirectory;
      pages: MdxSectionPage[];
    }
  >();

  for (const [path, pageModule] of Object.entries(modules)) {
    const parts = path.replace(/^\.\//, "").split("/");
    const meta = parsePageMeta(pageModule.meta, path);

    if (parts.length === 2 && parts[1] === "page.mdx") {
      const page = parseOrderedDirectory(parts[0]!, `${label} page`);

      flatPages.push({
        id: page.id,
        order: page.order,
        label: meta.label,
        description: meta.description,
        meta,
        Page: pageModule.default,
      });
      continue;
    }

    if (parts.length === 3 && parts[2] === "page.mdx") {
      const group = parseOrderedDirectory(parts[0]!, `${label} group`);
      const page = parseOrderedDirectory(parts[1]!, `${label} page`);
      const existing = groupedPages.get(group.id);

      if (existing && existing.group.order !== group.order) {
        throw new Error(
          `${label} group "${group.id}" uses multiple numeric prefixes.`,
        );
      }

      const groupEntry = existing ?? { group, pages: [] };
      groupEntry.pages.push({
        id: `${group.id}/${page.id}`,
        order: page.order,
        label: meta.label,
        description: meta.description,
        groupId: group.id,
        meta,
        Page: pageModule.default,
      });
      groupedPages.set(group.id, groupEntry);
      continue;
    }

    throw new Error(
      `Invalid ${label} page path "${path}". Expected ./NN-page/page.mdx or ./NN-group/NN-page/page.mdx.`,
    );
  }

  flatPages.sort(
    (left, right) =>
      left.order - right.order || left.id.localeCompare(right.id),
  );

  const groups = Array.from(groupedPages.values())
    .map(({ group, pages }) => ({
      id: group.id,
      order: group.order,
      label: sentenceCase(group.id),
      pages: pages.sort(
        (left, right) =>
          left.order - right.order || left.id.localeCompare(right.id),
      ),
    }))
    .sort(
      (left, right) =>
        left.order - right.order || left.id.localeCompare(right.id),
    );

  const items: MdxSectionItem[] = [
    ...flatPages.map((page) => ({
      type: "page" as const,
      order: page.order,
      page,
    })),
    ...groups.map((group) => ({
      type: "group" as const,
      order: group.order,
      group,
    })),
  ].sort(
    (left, right) =>
      left.order - right.order ||
      (left.type === "page" ? left.page.id : left.group.id).localeCompare(
        right.type === "page" ? right.page.id : right.group.id,
      ),
  );

  const pages = items.flatMap((item) =>
    item.type === "page" ? [item.page] : item.group.pages,
  );
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
