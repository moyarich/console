import { useState } from "react";
import {
  Console,
  type ConsoleContextMenuAction,
  type ConsoleMessageAction,
  type ConsoleMessageData,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const INITIAL_MESSAGES: ConsoleMessageData[] = [
  {
    id: "build-info",
    method: "info",
    source: "src/build.ts:18",
    data: ["Build completed", { durationMs: 842, files: 27 }],
    depth: 0,
  },
  {
    id: "request-error",
    method: "error",
    source: "src/api.ts:42",
    data: ["Request failed", { status: 503, retryable: true }],
    depth: 0,
  },
  {
    id: "plain-log",
    method: "log",
    data: ["This message has no source metadata."],
    depth: 0,
  },
];

export default function ExtensibleActionsExample() {
  const [messages, setMessages] = useState<ConsoleMessageData[]>(
    INITIAL_MESSAGES,
  );
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [lastAction, setLastAction] = useState(
    "Right-click the console, an object, or a message to try the actions.",
  );

  const contextMenuActions: ConsoleContextMenuAction[] = [
    {
      id: "inspect-context",
      label: "Inspect target",
      icon: <span aria-hidden="true">◎</span>,
      onSelect: (context) => {
        if (context.kind === "message") {
          setLastAction(
            `Context action: message #${context.index + 1} (${context.message.method})`,
          );
          return;
        }

        if (context.kind === "object") {
          setLastAction(
            `Context action: object with ${Object.keys(context.value).length} enumerable keys`,
          );
          return;
        }

        setLastAction(
          `Context action: console with ${context.hasMessages ? "output" : "no output"}`,
        );
      },
    },
    {
      id: "report-count",
      label: "Report message count",
      visible: (context) => context.kind === "console",
      disabled: ({ hasMessages }) => !hasMessages,
      onSelect: () => {
        setLastAction(`Host command: ${messages.length} messages are visible.`);
      },
    },
  ];

  const messageActions: ConsoleMessageAction[] = [
    {
      id: "bookmark",
      label: "Toggle bookmark",
      icon: <span aria-hidden="true">★</span>,
      onSelect: ({ message, index }) => {
        const key = message.id ?? `message-${index}`;
        const wasBookmarked = bookmarks.has(key);

        setBookmarks((current) => {
          const next = new Set(current);

          if (wasBookmarked) {
            next.delete(key);
          } else {
            next.add(key);
          }

          return next;
        });
        setLastAction(
          wasBookmarked
            ? `Removed bookmark from message #${index + 1}.`
            : `Bookmarked message #${index + 1}.`,
        );
      },
    },
    {
      id: "open-source",
      label: "Open source",
      disabled: ({ message }) => !message.source,
      onSelect: ({ message }) => {
        setLastAction(`Host command: open ${message.source}`);
      },
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
        setLastAction(`Retried message #${index + 1}.`);
      },
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="button-row">
        <button
          type="button"
          onClick={() => {
            setMessages(INITIAL_MESSAGES);
            setBookmarks(new Set());
            setLastAction("Example reset.");
          }}
        >
          Reset example
        </button>
      </div>

      <div
        role="status"
        style={{
          border: "1px solid #d6deeb",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 13,
        }}
      >
        <strong>Last host action:</strong> {lastAction}
        <br />
        <strong>Bookmarks:</strong> {bookmarks.size}
      </div>

      <Console
        messages={messages}
        onClear={() => {
          setMessages([]);
          setLastAction("Built-in clear action cleared the console.");
        }}
        contextMenuActions={contextMenuActions}
        messageActions={messageActions}
        subtitle="Right-click the console, an object, or a message"
      />
    </div>
  );
}
