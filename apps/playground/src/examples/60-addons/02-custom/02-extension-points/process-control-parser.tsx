import { useMemo, useSyncExternalStore } from "react";
import {
  Console,
  consoleExtensionPoints,
  consoleServices,
  type ConsoleAddon,
  type ConsoleDataService,
  type ConsoleProcessControlParser,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

function ProcessState({ data }: { data: ConsoleDataService }) {
  const snapshot = useSyncExternalStore(
    (listener) => {
      const subscription = data.subscribe(listener);
      return () => subscription.dispose();
    },
    data.getSnapshot,
    data.getSnapshot,
  );
  const cwdEvent =
    snapshot.mode === "ansi"
      ? snapshot.controlEvents.find((event) => event.type === "cwd")
      : undefined;

  return (
    <div role="status" style={{ fontSize: 12 }}>
      Parsed cwd: {String(cwdEvent?.data?.cwd ?? "waiting")}
    </div>
  );
}

function createDemoControlParser(): ConsoleProcessControlParser {
  let buffered = "";

  return {
    id: "demo-control-parser",
    reset() {
      buffered = "";
    },
    parse(output) {
      const value = buffered + output.data;

      if (value.startsWith("[[cwd:") && !value.includes("]]")) {
        buffered = value;
        return { omit: true };
      }

      const match = /^\[\[cwd:([^\]]+)\]\](.*)$/s.exec(value);

      if (!match) {
        buffered = "";
        return { data: value };
      }

      buffered = "";

      return {
        data: match[2] ?? "",
        events: [{ type: "cwd", data: { cwd: match[1] } }],
      };
    },
  };
}

export default function ProcessControlParserExample() {
  const addons = useMemo<ConsoleAddon[]>(
    () => [
      {
        id: "example.process-control-parser",
        activate(host) {
          const data = host.services.require(consoleServices.data);

          host.extensions.register(
            consoleExtensionPoints.processControlParser,
            createDemoControlParser(),
            { id: "demo-control-parser" },
          );
          host.extensions.register(
            consoleExtensionPoints.panelElement,
            {
              id: "process-state",
              placement: "before-output",
              render: (context) =>
                context.mode === "ansi" ? <ProcessState data={data} /> : undefined,
            },
            { id: "process-state" },
          );
        },
      },
    ],
    [],
  );

  return (
    <Console
      mode="ansi"
      messages={["[[cwd:/work", "space]]Build complete\n"]}
      addons={addons}
      title="processControlParser"
      subtitle="Raw controls are parsed before line normalization."
    />
  );
}
