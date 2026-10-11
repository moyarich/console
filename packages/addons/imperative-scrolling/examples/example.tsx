import { useMemo, useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import {
  createImperativeScrollingAddon,
  IMPERATIVE_SCROLLING_ADDON_ID,
} from "@moyarich/console-addon-imperative-scrolling";
import "@moyarich/console/styles.css";

const initialMessages: ConsoleMessageData[] = Array.from(
  { length: 40 },
  (_, index) => ({
    id: `message-${index + 1}`,
    method: "log",
    depth: 0,
    data: [`Message ${index + 1}`],
  }),
);

export default function ImperativeScrollingExample() {
  const [messages, setMessages] = useState(initialMessages);
  const [enabled, setEnabled] = useState(true);
  const addon = useMemo(() => createImperativeScrollingAddon(), []);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />{" "}
        Enable scrolling addon
      </label>
      <button
        type="button"
        onClick={() =>
          setMessages((current) => [
            ...current,
            {
              id: `message-${current.length + 1}`,
              method: "log",
              depth: 0,
              data: [`Appended message ${current.length + 1}`],
            },
          ])
        }
      >
        Append output
      </button>
      <Console
        messages={messages}
        addons={[addon]}
        disabledAddonIds={enabled ? [] : [IMPERATIVE_SCROLLING_ADDON_ID]}
        title="Scrolling addon actions"
        subtitle="Open the ellipsis menu for Top, Latest output, and Focus output."
        style={{ height: 320 }}
      />
    </div>
  );
}
