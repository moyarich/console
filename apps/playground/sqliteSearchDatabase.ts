import type { Database, SqlJsStatic } from "sql.js";
import { words, nearWord } from "./src/utils/sidebarSearch";

export interface IndexedDocument {
  key: string;
  title: string;
  description: string;
  body: string;
}

export function buildSearchDatabase(
  SQL: SqlJsStatic,
  documents: Iterable<IndexedDocument>,
): Uint8Array {
  const db = new SQL.Database();
  try {
    db.run("PRAGMA foreign_keys = ON");
    db.run(`CREATE TABLE documents (id INTEGER PRIMARY KEY, key TEXT UNIQUE NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, body TEXT NOT NULL);
      CREATE TABLE tokens (doc_id INTEGER NOT NULL REFERENCES documents(id), word TEXT NOT NULL, field TEXT NOT NULL, PRIMARY KEY(doc_id, word, field)) WITHOUT ROWID;
      CREATE INDEX token_prefix ON tokens(word, doc_id);
      CREATE INDEX title_tokens ON tokens(field, word, doc_id);`);
    db.run("BEGIN");
    for (const document of [...documents].sort((a, b) =>
      a.key.localeCompare(b.key),
    )) {
      db.run(
        "INSERT INTO documents (key, title, description, body) VALUES (?, ?, ?, ?)",
        [document.key, document.title, document.description, document.body],
      );
      const documentId = Number(
        db.exec("SELECT last_insert_rowid()")[0]!.values[0]![0],
      );
      for (const [field, text] of [
        ["title", document.title],
        ["content", `${document.description} ${document.body}`],
      ]) {
        for (const word of new Set(words(text!)))
          db.run("INSERT INTO tokens VALUES (?, ?, ?)", [
            documentId,
            word,
            field!,
          ]);
      }
    }
    db.run("COMMIT");
    return db.export();
  } finally {
    db.close();
  }
}

export function querySearchDatabase(db: Database, query: string): string[] {
  const terms = words(query);
  if (!terms.length) return [];
  db.create_function("near_word", (term, word) =>
    Number(nearWord(String(term), String(word))),
  );
  let keys: Set<string> | undefined;
  for (const term of terms) {
    const result = db.exec(
      `SELECT documents.key FROM tokens JOIN documents ON documents.id = tokens.doc_id WHERE word >= ? AND word < ?
      UNION SELECT documents.key FROM tokens JOIN documents ON documents.id = tokens.doc_id WHERE field = 'title' AND near_word(?, word) = 1`,
      [term, `${term}\uffff`, term],
    );
    const matches = new Set(
      (result[0]?.values ?? []).map(([key]) => String(key)),
    );
    keys = keys
      ? new Set([...keys].filter((key) => matches.has(key)))
      : matches;
    if (!keys.size) break;
  }
  return [...(keys ?? [])];
}
