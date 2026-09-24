import {
  Console,
  type ConsoleAnsiModeProps,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";

const streamingAnsiChunks: ConsoleStdoutEntry[] = [
  {
    data: "\u001b[1;36mStarting production build\u001b[0m\n",
    stream: "stdout",
  },
  { data: "Resolving dependencies…\n", stream: "stdout" },
  {
    data: "\u001b[33mWarning: optional source maps disabled\u001b[0m\n",
    stream: "stderr",
  },
  ...Array.from({ length: 11 }, (_, index) => ({
    data: `\r\u001b[36mBundling: ${index * 10}% [${"█".repeat(index)}${"░".repeat(10 - index)}]\u001b[0m${index === 10 ? "\n" : ""}`,
    stream: "stdout" as const,
  })),
  { data: "\u001b[32m✓ Compiled 24 modules\u001b[0m\n", stream: "stdout" },
  { data: "\u001b[35mWriting assets…\u001b[0m\n", stream: "stdout" },
  { data: "\u001b[1;32mBuild complete\u001b[0m\n", stream: "stdout" },
];

function StreamingAnsiStory(args: ConsoleAnsiModeProps) {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>([]);
  const [running, setRunning] = useState(false);
  const nextChunk = useRef(0);
  const complete = nextChunk.current === streamingAnsiChunks.length;

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      const index = nextChunk.current;
      const chunk = streamingAnsiChunks[index];
      if (!chunk) {
        setRunning(false);
        return;
      }

      nextChunk.current += 1;
      setMessages((current) => [
        ...current,
        { ...chunk, id: `stream-${index}` },
      ]);

      if (nextChunk.current === streamingAnsiChunks.length) {
        setRunning(false);
      }
    }, 300);

    return () => window.clearInterval(timer);
  }, [running]);

  const reset = () => {
    setRunning(false);
    nextChunk.current = 0;
    setMessages([]);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          disabled={running || complete}
          onClick={() => setRunning(true)}
        >
          {messages.length ? "Resume stream" : "Start stream"}
        </button>
        <button
          type="button"
          disabled={!running}
          onClick={() => setRunning(false)}
        >
          Stop stream
        </button>
        <button type="button" onClick={reset}>
          Reset stream
        </button>
        <span role="status">
          {running
            ? "Streaming"
            : complete
              ? "Complete"
              : messages.length
                ? "Stopped"
                : "Ready"}
        </span>
      </div>
      <Console {...args} messages={messages} onClear={reset} />
    </div>
  );
}

const meta = {
  title: "Console/ANSI Process Output",
  component: Console,
  args: {
    mode: "ansi",
    onClear: () => undefined,
    style: { height: 360, minHeight: 240, maxHeight: 640 },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ConsoleAnsiModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StreamingAnsi: Story = {
  render: (args) => <StreamingAnsiStory {...args} />,
  args: {
    title: "Streaming ANSI build output",
    subtitle:
      "Colored stdout/stderr arrives every 300 ms; progress redraws in place",
    emptyMessage: "Start the stream to watch the build output arrive.",
    autoScroll: true,
    messages: [],
  },
};
