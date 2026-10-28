import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsolePersistenceAddon, stringifyConsolePersistenceRecord } from "@moyarich/console-addon-persistence";

function FileExample() {
  const [messages, setMessages] = useState<ConsoleMessageData[]>([]);
  const [status, setStatus] = useState("Records append to logs/persistence/events.ndjson in local Storybook.");
  const addon = useMemo(() => createConsolePersistenceAddon({
    batchSize: 1,
    flushInterval: 0,
    onError: (error) => setStatus(String(error)),
    adapters: [{
      async write(records) {
        const response = await fetch("/__storybook_persistence/events.ndjson", {
          method: "POST",
          headers: { "Content-Type": "application/x-ndjson" },
          body: records.map(stringifyConsolePersistenceRecord).join(""),
        });
        if (!response.ok) throw new Error(`Log write failed: ${response.status}. Run local Storybook to enable the file endpoint.`);
        setStatus(`Wrote ${records.length} record(s) to logs/persistence/events.ndjson`);
      },
    }],
  }), []);
  return <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
    <button type="button" onClick={() => setMessages((current) => [...current, {
      id: `file-${current.length}`, method: "log", depth: 0,
      data: [`File event ${current.length + 1}`],
    }])}>Write file log</button>
    <Console messages={messages} addons={[addon]} />
    <p role="status">{status}</p>
  </div>;
}
const meta = { title: "Addons/Persistence", component: FileExample } satisfies Meta<typeof FileExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const File: Story = {};
