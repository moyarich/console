import initSqlJs from "sql.js";
import { resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import {
  buildSearchDatabase,
  type IndexedDocument,
} from "../src/search-sqlite/database";
import remarkSearchIndex from "../src/search-sqlite/remarkSearchIndex";
import { toIndexedDocument } from "../src/search-sqlite/indexDocument";

export function sqliteSearchPlugin() {
  const documents = new Map<string, IndexedDocument>();
  const paths = new Map<string, string>();
  const dependencies = new Map<string, Set<string>>();
  const sourceDependencies = new Map<string, Set<string>>();
  function removeDependencies(source: string) {
    for (const dependency of sourceDependencies.get(source) ?? []) {
      const sources = dependencies.get(dependency);
      sources?.delete(source);
      if (!sources?.size) dependencies.delete(dependency);
    }
    sourceDependencies.delete(source);
  }
  let devServer: ViteDevServer | undefined;
  const refresh = () => devServer?.ws.send("sqlite-search:updated", {});
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
      onDocument(document: {
        key: string;
        text: string;
        frontmatter: string;
        path: string;
        dependencies: string[];
      }) {
        const source = resolve(document.path);
        removeDependencies(source);
        paths.set(source, document.key);
        const imports = new Set(
          document.dependencies.map((path) => resolve(path)),
        );
        sourceDependencies.set(source, imports);
        for (const dependency of imports) {
          if (!dependencies.has(dependency))
            dependencies.set(dependency, new Set());
          dependencies.get(dependency)!.add(source);
          devServer?.watcher.add(dependency);
        }
        documents.set(document.key, toIndexedDocument(document));
        refresh();
      },
    },
  ];
  const plugin: Plugin = {
    name: "sqlite-search-index",
    buildStart() {
      documents.clear();
      paths.clear();
      dependencies.clear();
      sourceDependencies.clear();
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      if (this.environment.config.command === "serve")
        return 'export default import.meta.env.BASE_URL + "@search.sqlite";';
      reference = this.emitFile({
        type: "asset",
        name: "search.sqlite",
        source: new Uint8Array(),
      });
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
      devServer = server;
      async function reindexDependents(path: string) {
        const sources = [...(dependencies.get(resolve(path)) ?? [])];
        for (const source of sources) {
          for (const mod of server.moduleGraph.getModulesByFile(source) ?? []) {
            server.moduleGraph.invalidateModule(mod);
            await server.transformRequest(mod.url);
          }
        }
      }
      server.watcher.on("change", (path) => {
        void reindexDependents(path).catch((error: unknown) =>
          server.config.logger.error(String(error)),
        );
      });
      server.watcher.on("unlink", (path) => {
        void reindexDependents(path).catch((error: unknown) =>
          server.config.logger.error(String(error)),
        );
        const key = paths.get(resolve(path));
        if (!key) return;
        paths.delete(resolve(path));
        removeDependencies(resolve(path));
        documents.delete(key);
        refresh();
      });
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
