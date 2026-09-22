import { useMemo } from "react";
import {
  Console,
  consoleCapabilities,
  consoleExtensionPoints,
  createConsoleServiceToken,
  type ConsoleAddon,
  type ConsoleMessageData,
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

function createDiagnosticsAddon(): ConsoleAddon {
  return {
    id: "example.diagnostics",
    activate(host) {
      if (!host.capabilities.has(consoleCapabilities.structuredMessages)) {
        return;
      }

      host.services.provide(addonInfoService, {
        label: "Diagnostics addon",
      });

      host.extensions.register(consoleExtensionPoints.linkProvider, {
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
      });

      host.extensions.register(consoleExtensionPoints.valueRenderer, {
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
      });
    },
  };
}

function createActionsAddon(): ConsoleAddon {
  return {
    id: "example.actions",
    activate(host) {
      const info = host.services.require(addonInfoService);

      host.extensions.register(consoleExtensionPoints.panelAction, {
        id: "addon-status",
        label: `About ${info.label}`,
        onSelect: () => {
          window.alert(`${info.label} is active`);
        },
      });

      host.extensions.register(consoleExtensionPoints.contextMenuAction, {
        id: "copy-addon-context",
        label: "Show addon context",
        onSelect: ({ kind }) => {
          window.alert(`${info.label} context: ${kind}`);
        },
      });

      host.extensions.register(consoleExtensionPoints.messageAction, {
        id: "addon-info",
        label: `Inspect with ${info.label}`,
        onSelect: ({ message }) => {
          window.alert(`${info.label} handled ${message.id ?? "message"}`);
        },
      });
    },
  };
}

const messages: ConsoleMessageData[] = [
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

export default function AddonsExample() {
  const addons = useMemo(
    () => [createDiagnosticsAddon(), createActionsAddon()],
    [],
  );

  return (
    <Console
      messages={messages}
      addons={addons}
      subtitle="One addon API composing links, renderers, actions, and services"
    />
  );
}
