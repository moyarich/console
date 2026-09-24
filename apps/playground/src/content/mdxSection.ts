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

export interface MdxSection<TPage extends MdxSectionPage = MdxSectionPage> {
  id: string;
  label: string;
  pages: readonly TPage[];
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
  const pages = Object.entries(modules)
    .map(([path, pageModule]) => {
      const parts = path.replace(/^\.\//, "").split("/");

      if (parts.length !== 2 || parts[1] !== "page.mdx") {
        throw new Error(
          `Invalid ${label} page path "${path}". Expected ./NN-page/page.mdx.`,
        );
      }

      const page = parseOrderedDirectory(parts[0]!, `${label} page`);
      const meta = parsePageMeta(pageModule.meta, path);

      return {
        id: page.id,
        order: page.order,
        label: meta.label,
        description: meta.description,
        meta,
        Page: pageModule.default,
      };
    })
    .sort(
      (left, right) =>
        left.order - right.order || left.id.localeCompare(right.id),
    );

  const getPage = (pageId: string) =>
    pages.find((page) => page.id === pageId);

  return {
    id,
    label,
    pages,
    defaultPage: defaultPageId ? getPage(defaultPageId) : pages[0],
    getPage,
  };
}
