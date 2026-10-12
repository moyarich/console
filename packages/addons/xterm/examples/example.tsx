import { useMemo, useState } from "react";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import { createConsoleXtermAddon } from "@moyarich/console-addon-xterm";

const initial: ConsoleStdoutEntry[] = [
  { id: "start", data: "\u001b[36mStarting service\u001b[0m\r\n", stream: "stdout" },
  { id: "warn", data: "\u001b[33mWarning: retries enabled\u001b[0m\r\n", stream: "stderr" },
];

export default function XtermExample() {
  const addon = useMemo(() => createConsoleXtermAddon(), []);
  const [enabled, setEnabled] = useState(true);
  const [entries, setEntries] = useState(initial);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div>
        <label><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Use xterm.js</label>
        <button type="button" onClick={() => setEntries((current) => [...current, { id: String(current.length), data: "New output\r\n" }])}>Append</button>
        <button type="button" onClick={() => setEntries([])}>Clear</button>
      </div>
      <Console mode="terminal" messages={entries} addons={enabled ? [addon] : []} style={{ height: 350 }} />
    </div>
  );
}
