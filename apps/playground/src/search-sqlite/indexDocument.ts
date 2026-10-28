import { parse } from "yaml";
import type { IndexedDocument } from "./database.ts";
import type { SearchDocument } from "./remarkSearchIndex.ts";

export function toIndexedDocument(document: SearchDocument): IndexedDocument {
  const meta = parse(document.frontmatter) ?? {};
  return {
    key: document.key,
    title: [meta.label ?? "", meta.title ?? ""].join(" "),
    description: meta.description ?? "",
    body: document.text,
  };
}
