export interface PageTocOptions {
  show?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  label?: string;
}

export interface ResolvedPageTocOptions {
  show: boolean;
  collapsible: boolean;
  defaultOpen: boolean;
  label: string;
}

export interface PageMeta {
  label: string;
  title?: string;
  description?: string;
  toc?: boolean | PageTocOptions;
  sidebarOutline?: boolean;
  outlineLabelPrefix?: string;
  [key: string]: unknown;
}

function assertOptionalString(
  metadata: Record<string, unknown>,
  key: string,
  sourcePath: string,
) {
  if (metadata[key] !== undefined && typeof metadata[key] !== "string") {
    throw new Error(
      `Invalid frontmatter metadata in ${sourcePath}: "${key}" must be a string when provided.`,
    );
  }
}

export function parsePageMeta(value: unknown, sourcePath: string): PageMeta {
  if (!value || typeof value !== "object") {
    throw new Error(
      `Missing frontmatter metadata in ${sourcePath}. Expected at least a non-empty "label".`,
    );
  }

  const metadata = value as Record<string, unknown>;

  if (typeof metadata.label !== "string" || metadata.label.trim() === "") {
    throw new Error(
      `Invalid frontmatter metadata in ${sourcePath}: "label" must be a non-empty string.`,
    );
  }

  assertOptionalString(metadata, "title", sourcePath);
  assertOptionalString(metadata, "description", sourcePath);
  assertOptionalString(metadata, "outlineLabelPrefix", sourcePath);

  if (
    metadata.sidebarOutline !== undefined &&
    typeof metadata.sidebarOutline !== "boolean"
  ) {
    throw new Error(
      `Invalid frontmatter metadata in ${sourcePath}: "sidebarOutline" must be a boolean when provided.`,
    );
  }

  if (
    metadata.toc !== undefined &&
    typeof metadata.toc !== "boolean" &&
    (typeof metadata.toc !== "object" || metadata.toc === null)
  ) {
    throw new Error(
      `Invalid frontmatter metadata in ${sourcePath}: "toc" must be a boolean or object when provided.`,
    );
  }

  if (typeof metadata.toc === "object" && metadata.toc !== null) {
    const toc = metadata.toc as Record<string, unknown>;

    for (const key of ["show", "collapsible", "defaultOpen"] as const) {
      if (toc[key] !== undefined && typeof toc[key] !== "boolean") {
        throw new Error(
          `Invalid frontmatter metadata in ${sourcePath}: "toc.${key}" must be a boolean when provided.`,
        );
      }
    }

    if (toc.label !== undefined && typeof toc.label !== "string") {
      throw new Error(
        `Invalid frontmatter metadata in ${sourcePath}: "toc.label" must be a string when provided.`,
      );
    }
  }

  return metadata as PageMeta;
}

export function resolvePageTocOptions(meta: PageMeta): ResolvedPageTocOptions {
  if (meta.toc === undefined || meta.toc === false) {
    return {
      show: false,
      collapsible: true,
      defaultOpen: true,
      label: "On this page",
    };
  }

  if (meta.toc === true) {
    return {
      show: true,
      collapsible: true,
      defaultOpen: true,
      label: "On this page",
    };
  }

  return {
    show: meta.toc.show ?? true,
    collapsible: meta.toc.collapsible ?? true,
    defaultOpen: meta.toc.defaultOpen ?? true,
    label: meta.toc.label ?? "On this page",
  };
}
