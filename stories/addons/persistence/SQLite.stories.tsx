import { useEffect, useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsolePersistenceAddon } from "@moyarich/console-addon-persistence";

function SQLiteExample() {
  const database = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState(0);
  const [messages, setMessages] = useState<ConsoleMessageData[]>([]);
  useEffect(() => {
    let active = true;
    void initSqlJs({ locateFile: () => wasmUrl }).then((SQL) => {
      if (!active) return;
      const db = new SQL.Database();
      db.run("CREATE TABLE logs (sequence INTEGER PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL)");
      database.current = db;
      setReady(true);
    });
    return () => {
      active = false;
      database.current?.close();
      database.current = null;
    };
  }, []);
  const addon = useMemo(() => createConsolePersistenceAddon({
    batchSize: 1,
    flushInterval: 0,
    adapters: [{
      write(batch) {
        const db = database.current;
        if (!db) throw new Error("SQLite is not initialized");
        const statement = db.prepare("INSERT INTO logs (sequence, kind, payload) VALUES (?, ?, ?)");
        try {
          for (const record of batch) statement.run([record.sequence, record.kind, JSON.stringify(record)]);
        } finally { statement.free(); }
        setRows(Number(db.exec("SELECT COUNT(*) FROM logs")[0]?.values[0]?.[0] ?? 0));
      },
    }],
  }), []);
  const add = () => setMessages((current) => [...current, {
    id: `sqlite-${current.length}`, method: "info", depth: 0,
    data: [`SQLite event ${current.length + 1}`],
  }]);
  return <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
    <button type="button" disabled={!ready} onClick={add}>Write SQLite log</button>
    <Console messages={messages} addons={[addon]} />
    <p role="status">{ready ? `${rows} rows persisted in in-memory SQLite` : "Loading SQLite…"}</p>
  </div>;
}
const meta = { title: "Addons/Persistence", component: SQLiteExample } satisfies Meta<typeof SQLiteExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SQLite: Story = {};
