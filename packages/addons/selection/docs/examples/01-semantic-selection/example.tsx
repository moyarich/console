import { useMemo } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleSelectionAddon } from "@moyarich/console-addon-selection";

const messages: ConsoleMessageData[] = [
  { id: "one", method: "log", data: ["One"], depth: 0 },
  { id: "two", method: "warn", data: ["Two"], depth: 0 },
  { id: "three", method: "error", data: ["Three"], depth: 0 },
];

export default function SelectionExample() {
  const addon = useMemo(() => {
    const next = createConsoleSelectionAddon();
    next.controller.setSelectedIds(["two"]);
    return next;
  }, []);

  return (
    <div>
      <button type="button" onClick={() => addon.controller.toggle("three")}>
        Toggle error selection
      </button>
      <Console messages={messages} addons={[addon]} style={{ height: 260 }} />
    </div>
  );
}
