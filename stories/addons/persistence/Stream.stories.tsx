import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import {
  createConsolePersistenceAddon,
  stringifyConsolePersistenceRecord,
} from "@moyarich/console-addon-persistence";

const initialMessages: ConsoleMessageData[] = [
  { id: "stream-welcome", method: "info", depth: 0, data: ["Persistence example ready"] },
  { id: "stream-sample", method: "log", depth: 0, data: ["Initial sample message"] },
];

function StreamExample() {
  const [messages, setMessages] = useState<ConsoleMessageData[]>(() => [...initialMessages]);
  const [output, setOutput] = useState("");
  const addon = useMemo(() => {
    const stream = new WritableStream<string>({
      write(chunk) {
        setOutput((current) => current + chunk);
      },
    });
    const writer = stream.getWriter();
    return createConsolePersistenceAddon({
      batchSize: 1,
      flushInterval: 0,
      adapters: [
        {
          async write(records) {
            for (const record of records) {
              await writer.write(stringifyConsolePersistenceRecord(record));
            }
          },
          async close() {
            await writer.close();
          },
        },
      ],
    });
  }, []);

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 800 }}>
      <button
        type="button"
        onClick={() =>
          setMessages((current) => [
            ...current,
            {
              id: `stream-${current.length}`,
              method: "log",
              depth: 0,
              data: [`Stream event ${current.length + 1}`],
            },
          ])
        }
      >
        Write stream
      </button>
      <Console messages={messages} addons={[addon]} />
      <pre
        aria-label="WritableStream NDJSON output"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {output}
      </pre>
    </div>
  );
}

const meta = {
  title: "Addons/Persistence",
  component: StreamExample,
} satisfies Meta<typeof StreamExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Stream: Story = {};
