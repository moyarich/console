import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleHandle,
  type ConsoleMode,
} from "@moyarich/console";

const messages = [
  {
    id: "mounted",
    method: "info" as const,
    depth: 0,
    data: ["Console mounted successfully"],
  },
];

function MountCallbackExample() {
  const [events, setEvents] = useState<string[]>([]);
  const [mounted, setMounted] = useState(true);
  const [mode, setMode] = useState<ConsoleMode>("console");
  const onMount = useCallback((handle: ConsoleHandle) => {
    setEvents((current) => [...current, "mounted"]);
    handle.scrollToBottom();
    return () => setEvents((current) => [...current, "unmounted"]);
  }, []);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
      <button type="button" onClick={() => setMounted((current) => !current)}>
        {mounted ? "Unmount Console" : "Mount Console"}
      </button>
      <button
        type="button"
        onClick={() =>
          setMode((current) => (current === "console" ? "terminal" : "console"))
        }
      >
        Switch mode
      </button>
      {mounted &&
        (mode === "terminal" ? (
          <Console
            mode="terminal"
            onMount={onMount}
            messages={["Console mounted successfully"]}
          />
        ) : (
          <Console onMount={onMount} messages={messages} />
        ))}
      <output aria-label="Mount events">{events.join(", ")}</output>
    </div>
  );
}

const meta = {
  title: "Console/Lifecycle",
  component: MountCallbackExample,
} satisfies Meta<typeof MountCallbackExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OnMount: Story = {};
