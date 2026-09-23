import { useMemo } from "react";
import {
  Console,
  consoleCapabilities,
  consoleExtensionPoints,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleMessageData,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

interface AddonInfoService {
  label: string;
}

interface Metric {
  kind: "metric";
  label: string;
  value: number;
  unit: string;
}

const addonInfoService =
  createConsoleServiceToken<AddonInfoService>("example.addon-info");

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

function parseMetric(text: string): Metric | undefined {
  const match = /^METRIC\s+(.+?)=(\d+(?:\.\d+)?)(\S+)$/.exec(text.trim());
  if (!match) return undefined;

  const [, label, numericValue, unit] = match;
  if (label === undefined || numericValue === undefined || unit === undefined) {
    return undefined;
  }

  return {
    kind: "metric",
    label,
    value: Number(numericValue),
    unit,
  };
}

function createExtensionPointsAddon(): ConsoleAddon {
  return {
    id: "example.extension-points",
    activate(host) {
      host.services.provide(addonInfoService, {
        label: "Extension-points addon",
      });

      if (host.capabilities.has(consoleCapabilities.processOutput)) {
        host.extensions.register(
          consoleExtensionPoints.processOutputProcessor,
          {
            id: "example-build-status",
            process(output, context) {
              if (!context.text.includes("BUILD_OK")) return;

              return {
                data: output.data.replace("BUILD_OK", "Build complete"),
                metadata: {
                  transformedBy: "processOutputProcessor",
                },
              };
            },
          },
          {
            id: "build-status",
            priority: 20,
          },
        );

        host.extensions.register(
          consoleExtensionPoints.structuredOutputParser,
          (text) => parseMetric(text),
          {
            id: "metric-parser",
            priority: 20,
          },
        );
      }

      host.extensions.register(
        consoleExtensionPoints.linkProvider,
        {
          id: "task-links",
          provideLinks(text) {
            return Array.from(text.matchAll(/TASK-\d+/g), (match) => ({
              text: match[0],
              start: match.index,
              end: match.index + match[0].length,
              title: "Open task",
              action: () => window.alert(`Open ${match[0]}`),
            }));
          },
        },
        {
          id: "task-links",
          priority: 20,
        },
      );

      host.extensions.register(
        consoleExtensionPoints.outputRenderer,
        {
          render(context) {
            // Claim the surface extension point while preserving the stock UI.
            return context.renderDefault();
          },
        },
        {
          id: "default-output-wrapper",
        },
      );

      if (host.capabilities.has(consoleCapabilities.structuredMessages)) {
        host.extensions.register(
          consoleExtensionPoints.messageRenderer,
          {
            match(message) {
              return message.id === "task";
            },
            render(_message, context) {
              // A message renderer can replace a row; this demo delegates back
              // to the built-in row so the other extension points stay visible.
              return context.renderDefault();
            },
          },
          {
            id: "task-message",
            priority: 20,
          },
        );
      }

      host.extensions.register(
        consoleExtensionPoints.valueRenderer,
        {
          type: "Object",
          match: isMetric,
          render(value) {
            if (!isMetric(value)) return undefined;

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
        {
          id: "metric-value",
          priority: 20,
        },
      );
    },
  };
}

function createActionsAddon(): ConsoleAddon {
  return {
    id: "example.extension-point-actions",
    activate(host) {
      const info = host.services.require(addonInfoService);

      host.extensions.register(
        consoleExtensionPoints.panelAction,
        {
          id: "addon-status",
          label: `About ${info.label}`,
          onSelect: () => {
            window.alert(`${info.label} is active`);
          },
        },
        {
          id: "addon-status",
        },
      );

      host.extensions.register(
        consoleExtensionPoints.contextMenuAction,
        {
          id: "copy-addon-context",
          label: "Show addon context",
          onSelect: ({ kind }) => {
            window.alert(`${info.label} context: ${kind}`);
          },
        },
        {
          id: "addon-context",
        },
      );

      host.extensions.register(
        consoleExtensionPoints.messageAction,
        {
          id: "addon-info",
          label: `Inspect with ${info.label}`,
          onSelect: ({ message }) => {
            window.alert(`${info.label} handled ${message.id ?? "message"}`);
          },
        },
        {
          id: "addon-message",
        },
      );
    },
  };
}

const structuredMessages: ConsoleMessageData[] = [
  {
    id: "task",
    method: "info",
    data: ["Build is tracked by TASK-1042."],
    depth: 0,
  },
  {
    id: "metric",
    method: "log",
    data: [
      "Bundle size",
      {
        kind: "metric",
        label: "Bundle",
        value: 184,
        unit: "KB",
      },
    ],
    depth: 0,
  },
];

const processMessages: ConsoleStdoutEntry[] = [
  {
    id: "build",
    stream: "stdout",
    data: "BUILD_OK for TASK-2048\n",
  },
  {
    id: "latency",
    stream: "stdout",
    data: "METRIC Latency=42ms\n",
  },
];

export default function ConsoleExtensionPointsUsageExample() {
  const addons = useMemo(
    () => [createExtensionPointsAddon(), createActionsAddon()],
    [],
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Console
        messages={structuredMessages}
        addons={addons}
        title="Structured console extension points"
        subtitle="Links, output/message/value renderers, panel/context/message actions, and a shared service"
        style={{ minHeight: 220 }}
      />

      <Console
        mode="ansi"
        messages={processMessages}
        addons={addons}
        title="ANSI process-output extension points"
        subtitle="Process-output processor + structured-output parser, plus shared link/render/action extension points"
        style={{ minHeight: 220 }}
      />
    </div>
  );
}
