import { useMemo } from "react";
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

function FeedSurface({
  messages,
}: {
  messages: readonly ConsoleMessageData[];
}) {
  return (
    <div
      role="log"
      aria-label="Custom structured console output"
      style={{
        display: "grid",
        gap: 8,
        padding: 12,
      }}
    >
      {messages.map((message, index) => (
        <div
          key={message.id ?? index}
          style={{
            border: "1px solid currentColor",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <strong>{message.method}</strong>
          <pre
            style={{
              margin: "6px 0 0",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(message.data, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}

function createFeedSurfaceAddon(): ConsoleAddon {
  return {
    id: "example.feed-surface",
    activate(host) {
      host.extensions.register(
        consoleExtensionPoints.outputRenderer,
        {
          mode: "console",
          render(context) {
            if (context.mode !== "console") return undefined;

            return <FeedSurface messages={context.messages} />;
          },
        },
        {
          id: "feed-surface",
          priority: 100,
        },
      );
    },
  };
}

const messages: ConsoleMessageData[] = [
  {
    id: "hello",
    method: "log",
    data: ["Hello", { ready: true }],
    depth: 0,
  },
  {
    id: "warning",
    method: "warn",
    data: ["Custom structured surface"],
    depth: 0,
  },
];

export default function StructuredOutputSurfaceAddonExample() {
  const addons = useMemo(() => [createFeedSurfaceAddon()], []);

  return (
    <Console
      messages={messages}
      addons={addons}
      subtitle="An addon replaces the built-in structured console surface"
    />
  );
}
