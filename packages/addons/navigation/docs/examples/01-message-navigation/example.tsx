import { useMemo, useRef } from "react";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleViewportService,
} from "@moyarich/console";
import { createConsoleNavigationAddon } from "@moyarich/console-addon-navigation";

const messages: ConsoleMessageData[] = [
  { id: "start", method: "log", data: ["Starting"], depth: 0 },
  { id: "warning", method: "warn", data: ["Slow request"], depth: 0 },
  { id: "error", method: "error", data: ["Request failed"], depth: 0 },
];

export default function NavigationExample() {
  const ref = useRef<ConsoleViewportService>(null);
  const addon = useMemo(() => createConsoleNavigationAddon(), []);

  return (
    <div>
      <button type="button" onClick={() => addon.controller.nextWarning()}>
        Next warning
      </button>
      <button type="button" onClick={() => addon.controller.nextError()}>
        Next error
      </button>
      <Console
        ref={ref}
        messages={messages}
        addons={[addon]}
        style={{ height: 260 }}
      />
    </div>
  );
}
