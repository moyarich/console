import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { querySearchDatabase } from "./database";

let database: Promise<import("sql.js").Database> | undefined;
self.onmessage = async (
  event: MessageEvent<{ id: number; query: string; url: string }>,
) => {
  const { id, query, url } = event.data;
  try {
    database ??= (async () => {
      const [SQL, response] = await Promise.all([
        initSqlJs({ locateFile: () => wasmUrl }),
        fetch(url, { signal: AbortSignal.timeout(15000) }),
      ]);
      if (!response.ok) throw new Error("Search index could not be loaded");
      const db = new SQL.Database(new Uint8Array(await response.arrayBuffer()));
      db.run("PRAGMA query_only = ON");
      return db;
    })();
    const keys = querySearchDatabase(await database, query);
    self.postMessage({ id, keys });
  } catch {
    database = undefined;
    self.postMessage({
      id,
      error: "Search could not load. Try searching again.",
    });
  }
};
