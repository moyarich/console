import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleAddon } from "@moyarich/console";

function ReadyEventsExample() {
  const [terminal, setTerminal] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  const addon = useMemo<ConsoleAddon>(() => ({ id: "healthy", activate: () => () => {} }), []);
  return (
    <div>
      <button type="button" onClick={() => setTerminal((v) => !v)}>Switch mode</button>
      <button type="button" onClick={() => setEnabled((v) => !v)}>Toggle addon</button>
      {terminal ? (
        <Console mode="terminal" messages={["hello"]} addons={[addon]} disabledAddonIds={enabled ? [] : ["healthy"]}
          onReady={({ mode, snapshot }) => setEvents((current) => [...current, `ready:${mode}:${snapshot.mode}`])}
          onError={(error, { phase }) => setEvents((current) => [...current, `error:${phase}:${String(error)}`])} />
      ) : (
        <Console messages={[]} addons={[addon]} disabledAddonIds={enabled ? [] : ["healthy"]}
          onReady={({ mode, snapshot }) => setEvents((current) => [...current, `ready:${mode}:${snapshot.mode}`])}
          onError={(error, { phase }) => setEvents((current) => [...current, `error:${phase}:${String(error)}`])} />
      )}
      <output aria-label="Ready events">{events.join(" | ")}</output>
    </div>
  );
}
const meta = { title: "Console/ReadyLifecycle", component: ReadyEventsExample } satisfies Meta<typeof ReadyEventsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ReadyEvents: Story = {};
