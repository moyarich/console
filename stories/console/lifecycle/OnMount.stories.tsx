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
  const [alternateCallback, setAlternateCallback] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const onMount = useCallback((handle: ConsoleHandle) => {
    setEvents((current) => [...current, "mounted"]);
    handle.scrollToBottom();
    return () => setEvents((current) => [...current, "unmounted"]);
  }, []);

  const onMountReplacement = useCallback((handle: ConsoleHandle) => {
    setEvents((current) => [...current, "replacement mounted"]);
    handle.scrollToBottom();
    return () => setEvents((current) => [...current, "replacement unmounted"]);
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
      <button
        type="button"
        onClick={() => setAlternateCallback((value) => !value)}
      >
        Replace callback
      </button>
      <button type="button" onClick={() => setPresentation((value) => !value)}>
        Toggle presentation
      </button>
      {mounted &&
        (mode === "terminal" ? (
          <Console
            mode="terminal"
            showHeader={!presentation}
            onMount={alternateCallback ? onMountReplacement : onMount}
            messages={["Console mounted successfully"]}
          />
        ) : (
          <Console
            onMount={alternateCallback ? onMountReplacement : onMount}
            showHeader={!presentation}
            messages={messages}
          />
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
