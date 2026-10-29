import { useEffect, useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import {
  Console,
  useConsoleMessages,
  type ConsoleMessageData,
} from "@moyarich/console";
import { createConsolePersistenceAddon } from "@moyarich/console-addon-persistence";

const initialMessages: ConsoleMessageData[] = [
  {
    id: "sqlite-welcome",
    method: "info",
    depth: 0,
    data: ["Persistence example ready"],
  },
  {
    id: "sqlite-sample",
    method: "log",
    depth: 0,
    data: ["Initial sample message"],
  },
];

function SQLiteExample() {
  const database = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState(0);
  const { messages, events } = useConsoleMessages({ initialMessages });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void initSqlJs({ locateFile: () => wasmUrl })
      .then(async (SQL) => {
        if (!active) return;
        const existing = await fetch("/__storybook_persistence/console.sqlite");
        const bytes = existing.ok
          ? new Uint8Array(await existing.arrayBuffer())
          : undefined;
        if (!active) return;
        const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
        db.run(
          "CREATE TABLE IF NOT EXISTS logs (sequence INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, payload TEXT NOT NULL)",
        );
        database.current = db;
        setReady(true);
        setRows(
          Number(db.exec("SELECT COUNT(*) FROM logs")[0]?.values[0]?.[0] ?? 0),
        );
      })
      .catch((cause: unknown) => {
        if (active) setError(String(cause));
      });
    return () => {
      active = false;
      database.current?.close();
      database.current = null;
    };
  }, []);
  const addon = useMemo(
    () =>
      createConsolePersistenceAddon({
        batchSize: 1,
        flushInterval: 0,
        onError: (cause) => setError(String(cause)),
        adapters: [
          {
            async write(batch) {
              const db = database.current;
              if (!db) throw new Error("SQLite is not initialized");
              db.run("BEGIN TRANSACTION");
              const statement = db.prepare(
                "INSERT INTO logs (kind, payload) VALUES (?, ?)",
              );
              try {
                for (const record of batch)
                  statement.run([record.kind, JSON.stringify(record)]);
              } finally {
                statement.free();
              }
              db.run("COMMIT");
              const response = await fetch(
                "/__storybook_persistence/console.sqlite",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/octet-stream" },
                  body: new Uint8Array(db.export()),
                },
              );
              if (!response.ok)
                throw new Error(
                  `SQLite persistence failed: ${response.status}`,
                );
              setRows(
                Number(
                  db.exec("SELECT COUNT(*) FROM logs")[0]?.values[0]?.[0] ?? 0,
                ),
              );
            },
          },
        ],
      }),
    [],
  );
  const add = () =>
    events.emit("message", {
      id: `sqlite-${messages.length}`,
      method: "info",
      depth: 0,
      data: [`SQLite event ${messages.length + 1}`],
    });
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
      <button type="button" disabled={!ready} onClick={add}>
        Write SQLite log
      </button>
      {ready && <Console messages={messages} addons={[addon]} />}
      <p role="status">
        {error ??
          (ready
            ? `${rows} rows persisted in logs/persistence/console.sqlite`
            : "Loading SQLite…")}
      </p>
    </div>
  );
}
const meta = {
  title: "Addons/Persistence/SQLite",
  component: SQLiteExample,
} satisfies Meta<typeof SQLiteExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SQLite: Story = {};
