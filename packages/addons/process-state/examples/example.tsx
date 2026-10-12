import { useMemo } from "react";
import { Console } from "@moyarich/console";
import { createConsoleProcessStateAddon } from "@moyarich/console-addon-process-state";

export default function Example() {
  const addon = useMemo(() => createConsoleProcessStateAddon(), []);
  const messages = ["Starting...\n", "\u001b]9;4;1;75\u0007", "\u001b]9;9;/workspace\u001b\\", "Done\n"];
  return <Console mode="terminal" messages={messages} addons={[addon]} />;
}
