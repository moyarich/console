import { useMemo, useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleFeedAddon } from "@moyarich/console-addon-console-feed";

const messages: ConsoleMessageData[] = [
  {
    id: "one",
    method: "log",
    depth: 0,
    data: ["Server started", { port: 5173 }],
  },
  { id: "two", method: "info", depth: 0, data: ["Listening for requests"] },
  { id: "three", method: "warn", depth: 0, data: ["Deprecated option"] },
  { id: "four", method: "error", depth: 0, data: ["Connection failed"] },
];

export default function ConsoleFeedExample() {
  const addon = useMemo(() => createConsoleFeedAddon(), []);
  const [enabled, setEnabled] = useState(true);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Use feed renderer
      </label>
      <Console
        title="Build output"
        messages={messages}
        addons={enabled ? [addon] : []}
        style={{ height: 360 }}
      />
    </div>
  );
}
