import {
  Console,
  type ConsoleMessageRenderer,
  type ConsoleMessageData,
  type ConsoleValueRenderer,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

interface Metric {
  kind: "metric";
  label: string;
  value: number;
  unit: string;
  presentation?: "badge" | "default";
}

function isMetric(value: unknown): value is Metric {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<Metric>;
  return (
    candidate.kind === "metric" &&
    typeof candidate.label === "string" &&
    typeof candidate.value === "number" &&
    typeof candidate.unit === "string"
  );
}

const valueRenderers: ConsoleValueRenderer[] = [
  {
    type: "Object",
    match: isMetric,
    render: (value) => {
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

const messageRenderers: ConsoleMessageRenderer[] = [
  {
    method: "info",
    match: (message) => message.source === "build",
    render: (_message, { renderDefault }) => (
      <div
        style={{
          borderLeft: "3px solid currentColor",
          paddingLeft: 4,
        }}
      >
        {renderDefault()}
      </div>
    ),
  },
];

const messages: ConsoleMessageData[] = [
  {
    id: "build-summary",
    method: "info",
    source: "build",
    data: [
      "Build summary",
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
      "Compilation result",
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
  {
    id: "default-message",
    method: "log",
    data: ["Deployment ready", { ready: true }],
    depth: 0,
  },
];

export default function CustomRenderersExample() {
  return (
    <Console
      messages={messages}
      messageRenderers={messageRenderers}
      valueRenderers={valueRenderers}
      subtitle="Ordered renderer dispatch with built-in fallback"
    />
  );
}
