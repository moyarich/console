import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import type { Program } from "estree";

interface Node {
  type: string;
  value?: string;
  children?: Node[];
  data?: { estree?: Program };
}

/** Export only readable content and explicitly embedded raw example sources. */
export interface SearchDocument {
  key: string;
  text: string;
  frontmatter: string;
  path: string;
}
export default function remarkSearchIndex(
  options: {
    onDocument?: (document: SearchDocument) => void;
    external?: boolean;
  } = {},
) {
  return async (tree: Node, file: { path: string }) => {
    const parts: string[] = [];
    const examples = new Set<string>();
    let frontmatter = "";
    function visit(node: Node) {
      if (node.type === "yaml") frontmatter = node.value ?? "";
      if (["text", "inlineCode", "code"].includes(node.type) && node.value) {
        parts.push(node.value);
      }
      if (node.type === "mdxjsEsm") {
        for (const statement of node.data?.estree?.body ?? []) {
          const source =
            statement.type === "ImportDeclaration"
              ? statement.source.value
              : undefined;
          if (
            statement.type === "ImportDeclaration" &&
            typeof source === "string" &&
            source.startsWith(".") &&
            source.endsWith("?raw")
          ) {
            examples.add(resolve(dirname(file.path), source.slice(0, -4)));
          }
        }
      }
      node.children?.forEach(visit);
    }
    visit(tree);
    for (const path of examples) parts.push(await readFile(path, "utf8"));
    const searchText = parts.join("\n");
    const key = createHash("sha256").update(file.path).digest("hex");
    options.onDocument?.({ key, text: searchText, frontmatter, path: file.path });
    const exportName = options.external ? "searchKey" : "searchText";
    const exportValue = options.external ? key : searchText;
    tree.children?.push({
      type: "mdxjsEsm",
      value: `export const ${exportName} = ${JSON.stringify(exportValue)};`,
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              attributes: [],
              source: null,
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: exportName },
                    init: { type: "Literal", value: exportValue },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
}
