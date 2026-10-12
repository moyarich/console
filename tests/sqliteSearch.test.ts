import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import {
  buildSearchDatabase,
  querySearchDatabase,
} from "../apps/playground/sqliteSearchDatabase";
import { compile } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkSearchIndex from "../apps/playground/remarkSearchIndex";

const documents = [
  {
    key: "web",
    title: "WebSocket",
    description: "Stream remote output",
    body: "Lifecycle heading\nReconnect dropped sessions\nconsole.info(connection.readyState)",
  },
  {
    key: "http",
    title: "HTTP",
    description: "Fetch a response",
    body: "fetch(url)",
  },
  { key: "catalog", title: "Catalog", description: "", body: "" },
];
describe("SQLite documentation search", () => {
  it("exports a portable, queryable database and searches all terms with bounded title fuzziness", async () => {
    const SQL = await initSqlJs();
    const bytes = buildSearchDatabase(SQL, documents);
    expect(new TextDecoder().decode(bytes.slice(0, 15))).toBe(
      "SQLite format 3",
    );
    const db = new SQL.Database(bytes);
    try {
      db.run("PRAGMA query_only = ON");
      expect(
        db.exec("SELECT title FROM documents WHERE key = ?", ["web"])[0]
          ?.values,
      ).toEqual([["WebSocket"]]);
      for (const query of [
        "lifecycle",
        "dropped sessions",
        "console.info",
        "readyState",
        "REMOTE web",
        "websoket",
        "websockte",
      ]) {
        expect(querySearchDatabase(db, query)).toEqual(["web"]);
      }
      for (const query of [
        "readyState response",
        "log",
        "remtoe",
        "wbst",
        "!!!",
        "",
        "web' OR 1=1 --",
      ]) {
        expect(querySearchDatabase(db, query)).toEqual([]);
      }
      expect(querySearchDatabase(db, "htt")).toEqual(["http"]);
      expect(() => db.run("DELETE FROM documents")).toThrow();
    } finally {
      db.close();
    }
  });
  it("keeps content out of page JavaScript when using the external database", async () => {
    const captured: unknown[] = [];
    const result = String(
      await compile(
        {
          path: "/docs/page.mdx",
          value:
            "---\nlabel: Search\n---\n\n# Search heading\n\nunique-body-token",
        },
        {
          remarkPlugins: [
            remarkFrontmatter,
            [
              remarkSearchIndex,
              {
                external: true,
                onDocument: (document: unknown) => captured.push(document),
              },
            ],
          ],
        },
      ),
    );
    expect(captured).toEqual([
      {
        key: expect.any(String),
        text: "Search heading\nunique-body-token",
        frontmatter: "label: Search",
      },
    ]);
    expect(result).toContain("export const searchKey = ");
    expect(result).not.toContain("export const searchText = ");
  });
});
