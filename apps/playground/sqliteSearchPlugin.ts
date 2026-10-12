import initSqlJs from "sql.js";
import { parse } from "yaml";
import type { Plugin } from "vite";
import {
  buildSearchDatabase,
  type IndexedDocument,
} from "./sqliteSearchDatabase";
import remarkSearchIndex from "./remarkSearchIndex";

export function sqliteSearchPlugin() {
  const documents = new Map<string, IndexedDocument>();
  const virtualId = "virtual:search-database";
  const resolvedId = `\0${virtualId}`;
  let reference: string;
  const SQL = initSqlJs();
  const remark: [
    typeof remarkSearchIndex,
    Parameters<typeof remarkSearchIndex>[0],
  ] = [
    remarkSearchIndex,
    {
      external: true,
      onDocument(document: { key: string; text: string; frontmatter: string }) {
        const meta = parse(document.frontmatter) ?? {};
        documents.set(document.key, {
          key: document.key,
          title: [meta.label ?? "", meta.title ?? ""].join(" "),
          description: meta.description ?? "",
          body: document.text,
        });
      },
    },
  ];
  const plugin: Plugin = {
    name: "sqlite-search-index",
    buildStart() {
      documents.clear();
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      if (this.environment.config.command === "serve")
        return 'export default import.meta.env.BASE_URL + "@search.sqlite";';
      reference = this.emitFile({ type: "asset", name: "search.sqlite" });
      return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
    },
    async renderStart() {
      if (reference)
        this.setAssetSource(
          reference,
          buildSearchDatabase(await SQL, documents.values()),
        );
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (
          request.url?.split("?")[0] !== `${server.config.base}@search.sqlite`
        )
          return next();
        try {
          const bytes = buildSearchDatabase(await SQL, documents.values());
          response.setHeader("Content-Type", "application/vnd.sqlite3");
          response.setHeader("Cache-Control", "no-store");
          response.end(Buffer.from(bytes));
        } catch (error) {
          next(error);
        }
      });
    },
  };
  return { plugin, remark };
}
