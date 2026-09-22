import {
  Console,
  type ConsoleAnsiModeProps,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
export const meta = {
  title: "Console/ANSI Process Output",
  component: Console,
  args: {
    mode: "ansi",
    onClear: () => undefined,
    resizable: "vertical",
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
export type Story = StoryObj<typeof meta>;
export const tqdmChunks: ConsoleStdoutEntry[] = [
  {
    id: "tqdm-0",
    data: "\rDownloading:   0%|          | 0/100 [00:00<?, ?item/s]",
    stream: "stderr",
  },
  {
    id: "tqdm-1",
    data: "\rDownloading:   1%|          | 1/100 [00:00<00:04, 22.22item/s]",
    stream: "stderr",
  },
  {
    id: "tqdm-25",
    data: "\rDownloading:  25%|██▌       | 25/100 [00:01<00:03, 22.90item/s]",
    stream: "stderr",
  },
  {
    id: "tqdm-50",
    data: "\rDownloading:  50%|█████     | 50/100 [00:02<00:02, 23.12item/s]",
    stream: "stderr",
  },
  {
    id: "tqdm-75",
    data: "\rDownloading:  75%|███████▌  | 75/100 [00:03<00:01, 22.27item/s]",
    stream: "stderr",
  },
  {
    id: "tqdm-100",
    data: "\rDownloading: 100%|██████████| 100/100 [00:04<00:00, 22.38item/s]\n",
    stream: "stderr",
  },
  {
    id: "done",
    data: "Python task complete\n",
    stream: "stdout",
  },
];
export function LiveTqdmRedrawStory() {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>([]);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setMessages([]);

    let index = 0;
    const timer = window.setInterval(() => {
      const chunk = tqdmChunks[index];

      if (!chunk) {
        window.clearInterval(timer);
        return;
      }

      setMessages((current) => [...current, chunk]);
      index += 1;
    }, 450);

    return () => window.clearInterval(timer);
  }, [run]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <button type="button" onClick={() => setRun((current) => current + 1)}>
          Replay stream
        </button>
      </div>

      <Console
        mode="ansi"
        title="Live tqdm-style redraw"
        subtitle="Each leading carriage return replaces the current logical line"
        messages={messages}
        onClear={() => setMessages([])}
        resizable="vertical"
        style={{ height: 360, minHeight: 240, maxHeight: 640 }}
      />
    </div>
  );
}
export const jsonLines = [
  "Receiving structured output…\n",
  '{"event":"build","success":true,"assets":["app.js","app.css"]}\n',
  '[{"name":"API","healthy":true},{"name":"Worker","healthy":false}]\n',
  "{this is not valid JSON}\n",
];
export function ClearableOutputStory(args: ConsoleAnsiModeProps) {
  const [messages, setMessages] = useState(args.messages ?? []);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={() => setMessages(args.messages ?? [])}>
        Restore output
      </button>
      <Console {...args} messages={messages} onClear={() => setMessages([])} />
    </div>
  );
}
export const streamingAnsiChunks: ConsoleStdoutEntry[] = [
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
export function StreamingAnsiStory(args: ConsoleAnsiModeProps) {
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
      if (nextChunk.current === streamingAnsiChunks.length) setRunning(false);
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
