import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

interface Metric {
  kind: "metric";
  label: string;
  value: number;
  unit: string;
}

function isMetric(value: unknown): value is Metric {
  if (typeof value !== "object" || value === null) return false;

  const metric = value as Partial<Metric>;
  return (
    metric.kind === "metric" &&
    typeof metric.label === "string" &&
    typeof metric.value === "number" &&
    typeof metric.unit === "string"
  );
}

const messages: ConsoleMessageData[] = [
  {
    id: "metric",
    method: "log",
    data: ["Bundle", { kind: "metric", label: "Size", value: 184, unit: "KB" }],
    depth: 0,
  },
];

function createValueRendererAddon(): ConsoleAddon {
  return {
    id: "example.value-renderer",
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.valueRenderer,
        {
          type: "Object",
          match: ({ value }) => isMetric(value),
          render({ value }) {
            if (!isMetric(value)) return undefined;

            return (
              <strong>
                {value.label}: {value.value}
                {value.unit}
              </strong>
            );
          },
        },
        { id: "metric-value" },
      );
    },
  };
}

export default function ValueRendererExample() {
  const addons = useMemo(() => [createValueRendererAddon()], []);

  return (
    <Console
      messages={messages}
      addons={addons}
      title="valueRenderer"
      subtitle="Customize individual structured values."
    />
  );
}
