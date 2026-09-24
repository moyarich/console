import { useState } from "react";
import {
  Console,
  type ConsoleMessageAction,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const initialMessages: ConsoleMessageData[] = [
  {
    id: "build",
    method: "info",
    source: "src/build.ts:18",
    data: ["Build completed", { durationMs: 842 }],
    depth: 0,
  },
  {
    id: "request-error",
    method: "error",
    source: "src/api.ts:42",
    data: ["Request failed", { status: 503, retryable: true }],
    depth: 0,
  },
];

export default function MessageActionsExample() {
  const [messages, setMessages] =
    useState<ConsoleMessageData[]>(initialMessages);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());

  const messageActions: ConsoleMessageAction[] = [
    {
      id: "bookmark",
      label: "Toggle bookmark",
      onSelect: ({ message, index }) => {
        const key = message.id ?? `message-${index}`;
        setBookmarks((current) => {
          const next = new Set(current);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      },
    },
    {
      id: "open-source",
      label: "Open source",
      disabled: ({ message }) => !message.source,
      onSelect: ({ message }) => window.alert(`Open ${message.source}`),
    },
    {
      id: "retry",
      label: "Retry operation",
      separatorBefore: true,
      visible: ({ message }) => message.method === "error",
      onSelect: ({ message, index }) => {
        setMessages((current) => [
          ...current,
          {
            id: `retry-${message.id ?? index}-${current.length}`,
            method: "info",
            source: message.source,
            data: ["Retry requested", { originalMessageId: message.id }],
            depth: 0,
          },
        ]);
      },
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div role="status">
        <strong>Bookmarks:</strong> {bookmarks.size}
      </div>
      <Console
        messages={messages}
        messageActions={messageActions}
        title="Per-message actions"
      />
    </div>
  );
}
