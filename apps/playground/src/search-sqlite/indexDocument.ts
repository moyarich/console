import { parse } from "yaml";
import type { IndexedDocument } from "./database";
import type { SearchDocument } from "./remarkSearchIndex";

export function toIndexedDocument(document: SearchDocument): IndexedDocument {
  const meta = parse(document.frontmatter) ?? {};
  return {
    key: document.key,
    title: [meta.label ?? "", meta.title ?? ""].join(" "),
    description: meta.description ?? "",
    body: document.text,
  };
}
