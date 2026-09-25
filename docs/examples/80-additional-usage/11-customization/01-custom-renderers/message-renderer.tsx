import {
  Console,
  type ConsoleMessageData,
  type ConsoleMessageRenderer,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const messageRenderers: ConsoleMessageRenderer[] = [
  {
    method: "info",
    match: ({ message }) => message.source === "build",
    render: ({ renderDefault }) => (
      <div
        style={{
          borderLeft: "3px solid currentColor",
          paddingLeft: 6,
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
    data: ["Build completed", { durationMs: 842, modules: 42 }],
    depth: 0,
  },
  {
    id: "default-info",
    method: "info",
    source: "network",
    data: ["Request completed", { status: 200 }],
    depth: 0,
  },
];

export default function MessageRendererExample() {
  return (
    <Console
      messages={messages}
      messageRenderers={messageRenderers}
      title="Custom message renderer"
      subtitle="Only matching build messages use the custom row wrapper."
    />
  );
}
