import type { ComponentType } from "react";
import { parsePageMeta, type PageMeta } from "../content/pageMetadata";

export interface ConsoleApiPage {
  id: string;
  order: number;
  label: string;
  description?: string;
  meta: PageMeta;
  Page: ComponentType;
}

interface ApiPageModule {
  default: ComponentType;
  meta?: unknown;
}

const ORDERED_DIRECTORY_PATTERN = /^(\d+)-(.+)$/;

function parseApiPath(path: string) {
  const parts = path.replace(/^\.\//, "").split("/");

  if (parts.length !== 2) {
    throw new Error(
      `Invalid API page path "${path}". Expected ./NN-page/page.mdx.`,
    );
  }

  const directory = parts[0]!;
  const match = ORDERED_DIRECTORY_PATTERN.exec(directory);

  if (!match) {
    throw new Error(
      `Invalid API page directory "${directory}". Expected NN-name.`,
    );
  }

  return {
    id: match[2]!,
    order: Number(match[1]),
  };
}

const pageModules = import.meta.glob("./*/page.mdx", {
  eager: true,
}) as Record<string, ApiPageModule>;

export const CONSOLE_API_PAGES: readonly ConsoleApiPage[] = Object.entries(
  pageModules,
)
  .map(([path, pageModule]) => {
    const metadata = parsePageMeta(pageModule.meta, path);
    const page = parseApiPath(path);

    return {
      ...page,
      label: metadata.label,
      description: metadata.description,
      meta: metadata,
      Page: pageModule.default,
    };
  })
  .sort(
    (left, right) =>
      left.order - right.order || left.id.localeCompare(right.id),
  );
