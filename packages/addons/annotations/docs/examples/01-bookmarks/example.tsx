import { useMemo } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleAnnotationsAddon } from "@moyarich/console-addon-annotations";

const messages: ConsoleMessageData[] = [
  { id: "deploy", method: "warn", data: ["Deployment needs review"], depth: 0 },
  { id: "health", method: "log", data: ["Health check passed"], depth: 0 },
];

export default function AnnotationsExample() {
  const addon = useMemo(() => {
    const next = createConsoleAnnotationsAddon();
    next.controller.addAnnotation("deploy", {
      id: "important",
      label: "Important",
    });
    return next;
  }, []);

  return (
    <Console messages={messages} addons={[addon]} style={{ height: 260 }} />
  );
}
