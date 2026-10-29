import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleHandle } from "@moyarich/console";

function MountCallbackExample() {
  const [events, setEvents] = useState<string[]>([]);
  const onMount = (handle: ConsoleHandle) => {
    setEvents((current) => [...current, "mounted"]);
    handle.scrollToBottom();
    return () => setEvents((current) => [...current, "unmounted"]);
  };
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
      <Console
        onMount={onMount}
        messages={[{ id: "mounted", method: "info", depth: 0, data: ["Console mounted successfully"] }]}
      />
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
