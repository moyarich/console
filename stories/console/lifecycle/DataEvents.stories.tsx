import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleStdoutEntry,
} from "@moyarich/console";

const initialMessages: ConsoleMessageData[] = [
  { id: "initial", method: "info", depth: 0, data: ["Initial data"] },
];
const initialOutput: readonly (ConsoleStdoutEntry | string)[] = [
  "Initial terminal output",
];

function DataEventsExample() {
  const [mode, setMode] = useState<"console" | "terminal">("console");
  const [messages, setMessages] = useState(initialMessages);
  const [output, setOutput] = useState(initialOutput);
  const [events, setEvents] = useState<string[]>([]);
  const [decorated, setDecorated] = useState(false);
  const [modeTransitions, setModeTransitions] = useState<string[]>([]);
  const onModeChange = useCallback(
    (next: "console" | "terminal", previous: "console" | "terminal") => {
      setModeTransitions((current) => [...current, `${previous}->${next}`]);
    },
    [],
  );
  const onMessagesChange = useCallback(
    (next: readonly ConsoleMessageData[]) => {
      setEvents((current) => [...current, `messages:${next.length}`]);
    },
    [],
  );
  const onOutputChange = useCallback(
    (next: readonly (ConsoleStdoutEntry | string)[]) => {
      setEvents((current) => [...current, `output:${next.length}`]);
    },
    [],
  );
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 800 }}>
      <button
        onClick={() =>
          setMode((value) => (value === "console" ? "terminal" : "console"))
        }
      >
        Switch mode
      </button>
      <button onClick={() => setDecorated((value) => !value)}>
        Toggle presentation
      </button>
      <button
        onClick={() =>
          setMessages((current) => [
            ...current,
            {
              id: `message-${current.length}`,
              method: "log",
              depth: 0,
              data: ["New message"],
            },
          ])
        }
      >
        Add message
      </button>
      <button
        onClick={() =>
          setOutput((current) => [...current, "New terminal output"])
        }
      >
        Add terminal output
      </button>
      <button
        onClick={() => {
          setMessages([]);
          setOutput([]);
        }}
      >
        Clear input
      </button>
      {mode === "console" ? (
        <Console
          messages={messages}
          onMessagesChange={onMessagesChange}
          onModeChange={onModeChange}
          showHeader={!decorated}
          error={decorated ? "Presentation error" : undefined}
        />
      ) : (
        <Console
          mode="terminal"
          messages={output}
          onOutputChange={onOutputChange}
          onModeChange={onModeChange}
          showHeader={!decorated}
        />
      )}
      <output aria-label="Mode transition events">
        {modeTransitions.join(", ")}
      </output>
      <output aria-label="Data lifecycle events">{events.join(", ")}</output>
    </div>
  );
}
const meta = {
  title: "Console/Lifecycle",
  component: DataEventsExample,
} satisfies Meta<typeof DataEventsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DataEvents: Story = {};
