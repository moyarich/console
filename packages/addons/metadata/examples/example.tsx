import { useMemo } from "react";
import { Console } from "@moyarich/console";
import { createConsoleMetadataAddon } from "@moyarich/console-addon-metadata";

export default function Example() {
  const addons = useMemo(
    () => [createConsoleMetadataAddon({ mode: "relative" })],
    [],
  );
  const messages = [
    {
      id: "example",
      method: "log" as const,
      depth: 0,
      data: ["Metadata example"],
      source: "preview",
      timestamp: Date.now() - 8000,
    },
  ];
  return <Console messages={messages} addons={addons} />;
}
