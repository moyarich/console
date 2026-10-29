import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleAddon } from "@moyarich/console";

function AddonEventsExample() {
  const [enabled, setEnabled] = useState(true);
  const [replace, setReplace] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [failing, setFailing] = useState(false);
  const [disposalFails, setDisposalFails] = useState(false);
  const first = useMemo<ConsoleAddon>(() => ({ id: "example", activate: () => () => {} }), []);
  const replacement = useMemo<ConsoleAddon>(() => ({ id: "example", activate: () => () => {} }), []);
  const failingAddon = useMemo<ConsoleAddon>(() => ({ id: "failing", activate: () => { throw new Error("activation failed"); } }), []);
  const disposalAddon = useMemo<ConsoleAddon>(() => ({ id: "disposal", activate: () => () => { throw new Error("disposal failed"); } }), []);
  const addons = [replace ? replacement : first, ...(failing ? [failingAddon] : []), ...(disposalFails ? [disposalAddon] : [])];
  return (
    <div>
      <button onClick={() => setEnabled((value) => !value)}>Toggle addon</button>
      <button onClick={() => setReplace((value) => !value)}>Replace addon</button>
      <button onClick={() => setFailing((value) => !value)}>Toggle failing addon</button>
      <button onClick={() => setDisposalFails((value) => !value)}>Toggle disposal addon</button>
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
