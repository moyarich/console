import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleAddon } from "@moyarich/console";

function AddonEventsExample() {
  const [enabled, setEnabled] = useState(true);
  const [replace, setReplace] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const first = useMemo<ConsoleAddon>(() => ({ id: "example", activate: () => () => {} }), []);
  const replacement = useMemo<ConsoleAddon>(() => ({ id: "example", activate: () => () => {} }), []);
  const addons = [replace ? replacement : first];
  return (
    <div>
      <button onClick={() => setEnabled((value) => !value)}>Toggle addon</button>
      <button onClick={() => setReplace((value) => !value)}>Replace addon</button>
      <Console
        messages={[]}
        addons={addons}
        disabledAddonIds={enabled ? [] : ["example"]}
        onAddonsReady={({ addonIds, mode }) =>
          setEvents((current) => [...current, `${mode}:${addonIds.join(",") || "none"}`])
        }
        onAddonError={(error, id, phase) =>
          setEvents((current) => [...current, `error:${id}:${phase}:${String(error)}`])
        }
      />
      <output aria-label="Addon lifecycle events">{events.join(" | ")}</output>
    </div>
  );
}

const meta = {
  title: "Console/Lifecycle",
  component: AddonEventsExample,
} satisfies Meta<typeof AddonEventsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AddonEvents: Story = {};
