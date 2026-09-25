import {
  Console,
  type ConsoleMessageData,
  type ConsoleValueRenderer,
} from "@moyarich/console";
import "@moyarich/console/styles.css";
import { isMetric } from "./metric";

const valueRenderers: ConsoleValueRenderer[] = [
  {
    type: "Object",
    match: ({ value }) => isMetric(value),
    render: ({ value }) => {
      if (!isMetric(value) || value.presentation === "default") {
        return undefined;
      }

      return (
        <span
          style={{
            display: "inline-flex",
            gap: 6,
            alignItems: "baseline",
            border: "1px solid currentColor",
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          <span>{value.label}</span>
          <strong>
            {value.value}
            {value.unit}
          </strong>
        </span>
      );
    },
  },
];

const messages: ConsoleMessageData[] = [
  {
    id: "bundle-size",
    method: "log",
    data: [
      "Bundle size",
      {
        kind: "metric",
        label: "Bundle",
        value: 184,
        unit: "KB",
        presentation: "badge",
      },
    ],
    depth: 0,
  },
  {
    id: "fallback-value",
    method: "log",
    data: [
      "Module count",
      {
        kind: "metric",
        label: "Modules",
        value: 42,
        unit: "",
        presentation: "default",
      },
    ],
    depth: 0,
  },
];

export default function ValueRendererExample() {
  return (
    <Console
      messages={messages}
      valueRenderers={valueRenderers}
      title="Custom value renderer"
      subtitle="Return undefined to fall back to the built-in inspector."
    />
  );
}
