import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleAddon } from "@moyarich/console";

function ReadyEventsExample() {
  const [terminal, setTerminal] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [presentation, setPresentation] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [throwOnReady, setThrowOnReady] = useState(false);
  const [throwOnError, setThrowOnError] = useState(false);
  const addon = useMemo<ConsoleAddon>(
    () => ({ id: "healthy", activate: () => () => {} }),
    [],
  );
  return (
    <div>
      <button type="button" onClick={() => setTerminal((v) => !v)}>
        Switch mode
      </button>
      <button type="button" onClick={() => setEnabled((v) => !v)}>
        Toggle addon
      </button>
      <button type="button" onClick={() => setPresentation((v) => !v)}>
        Toggle presentation
      </button>
      <button type="button" onClick={() => setThrowOnReady((v) => !v)}>
        Toggle ready failure
      </button>
      <button type="button" onClick={() => setThrowOnError((v) => !v)}>
        Toggle error observer failure
      </button>
      {terminal ? (
        <Console
          mode="terminal"
          messages={["hello"]}
          showHeader={!presentation}
          addons={[addon]}
          disabledAddonIds={enabled ? [] : ["healthy"]}
          onReady={({ mode, snapshot }) => {
            if (throwOnReady) throw new Error("ready observer failed");
            setEvents((current) => [
              ...current,
              `ready:${mode}:${snapshot.mode}`,
            ]);
          }}
          onError={(error, { phase }) => {
            setEvents((current) => [
              ...current,
              `error:${phase}:${String(error)}`,
            ]);
            if (throwOnError) throw new Error("error observer failed");
          }}
        />
      ) : (
        <Console
          messages={[]}
          showHeader={!presentation}
          addons={[addon]}
          disabledAddonIds={enabled ? [] : ["healthy"]}
          onReady={({ mode, snapshot }) => {
            if (throwOnReady) throw new Error("ready observer failed");
            setEvents((current) => [
              ...current,
              `ready:${mode}:${snapshot.mode}`,
            ]);
          }}
          onError={(error, { phase }) => {
            setEvents((current) => [
              ...current,
              `error:${phase}:${String(error)}`,
            ]);
            if (throwOnError) throw new Error("error observer failed");
          }}
        />
      )}
      <output aria-label="Ready events">{events.join(" | ")}</output>
    </div>
  );
}
const meta = {
  title: "Console/ReadyLifecycle",
  component: ReadyEventsExample,
} satisfies Meta<typeof ReadyEventsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ReadyEvents: Story = {};
