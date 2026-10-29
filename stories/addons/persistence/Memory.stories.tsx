import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import {
  createConsolePersistenceAddon,
  type ConsolePersistenceRecord,
} from "@moyarich/console-addon-persistence";

const initialMessages: ConsoleMessageData[] = [
  { id: "memory-welcome", method: "info", depth: 0, data: ["Persistence example ready"] },
  { id: "memory-sample", method: "log", depth: 0, data: ["Initial sample message"] },
];

function MemoryExample() {
  const [records, setRecords] = useState<readonly ConsolePersistenceRecord[]>(
    [],
  );
  const [messages, setMessages] = useState<ConsoleMessageData[]>(() => [...initialMessages]);
  const addon = useMemo(
    () =>
      createConsolePersistenceAddon({
        batchSize: 1,
        flushInterval: 0,
        adapters: [
          {
            write(batch) {
              setRecords((current) => [...current, ...batch]);
            },
          },
        ],
      }),
    [],
  );

  const add = () =>
    setMessages((current) => [
      ...current,
      {
        id: `event-${current.length}`,
        method: "log",
        depth: 0,
        data: [`Persisted message ${current.length + 1}`],
      },
    ]);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
      <button type="button" onClick={add}>
        Log event
      </button>
      <Console messages={messages} addons={[addon]} />
      <button type="button" onClick={() => void addon.persistence.flush()}>
        Flush
      </button>
      <pre aria-label="Persisted JSON">{JSON.stringify(records, null, 2)}</pre>
    </div>
  );
}
const meta = {
  title: "Addons/Persistence",
  component: MemoryExample,
} satisfies Meta<typeof MemoryExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Memory: Story = {};
