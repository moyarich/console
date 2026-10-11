import { useMemo, useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleSearchAddon } from "@moyarich/console-addon-search";

const messages: ConsoleMessageData[] = Array.from(
  { length: 60 },
  (_, index) => ({
    id: `entry-${index}`,
    method: index % 8 === 0 ? "error" : "log",
    depth: 0,
    data: [
      `Build ${index + 1}: ${index % 8 === 0 ? "Error: retry build" : "Ready"}`,
    ],
  }),
);

export default function Example() {
  const addon = useMemo(() => createConsoleSearchAddon(), []);
  const [count, setCount] = useState(15);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={() =>
          setCount((value) => Math.min(messages.length, value + 15))
        }
      >
        Append 15 messages
      </button>
      <Console
        addons={[addon]}
        messages={messages.slice(0, count)}
        outputLabel="Searchable build output"
      />
    </div>
  );
}
