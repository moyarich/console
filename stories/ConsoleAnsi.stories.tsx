import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import PyodideTqdmProgressExample from "../apps/playground/src/examples/10-ansi/06-pyodide-tqdm-progress/example";
import {
  Console,
  type ConsoleAnsiModeProps,
  type ConsoleStdoutEntry,
} from "@moyarich/console";

const meta = {
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

export default meta;
type Story = StoryObj<typeof meta>;

const tqdmChunks: ConsoleStdoutEntry[] = [
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

export const TqdmLeadingCarriageReturn: Story = {
  args: {
    title: "tqdm leading carriage returns",
    subtitle: "Only the final progress frame should remain visible",
    messages: tqdmChunks,
  },
  play: async ({ canvasElement }) => {
    const text = canvasElement.textContent ?? "";

    if (!text.includes("Downloading: 100%")) {
      throw new Error("Expected the final tqdm progress frame to be visible.");
    }

    for (const staleFrame of [
      "Downloading:   0%",
      "Downloading:   1%",
      "Downloading:  25%",
      "Downloading:  50%",
      "Downloading:  75%",
    ]) {
      if (text.includes(staleFrame)) {
        throw new Error(
          `Stale tqdm progress frame remained visible: ${staleFrame}`,
        );
      }
    }

    if (!text.includes("Python task complete")) {
      throw new Error("Expected newline-completed output to remain visible.");
    }
  },
};

function LiveTqdmRedrawStory() {
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

export const LiveTqdmRedraw: Story = {
  render: () => <LiveTqdmRedrawStory />,
  args: {
    messages: [],
  },
};

export const PyodideTqdmBrowserRuntime: Story = {
  render: () => <PyodideTqdmProgressExample />,
  args: {
    messages: [],
  },
};

export const EmptyTerminal: Story = {
  args: {
    title: "Waiting for a process",
    emptyMessage: "Run a command to see stdout and stderr here.",
    messages: [],
  },
};

export const ColorsAndTextStyles: Story = {
  args: {
    title: "ANSI formatting",
    messages: [
      "\u001b[31mRed\u001b[0m  \u001b[32mGreen\u001b[0m  \u001b[33mYellow\u001b[0m  \u001b[34mBlue\u001b[0m\n",
      "\u001b[1mBold\u001b[0m  \u001b[3mItalic\u001b[0m  \u001b[4mUnderline\u001b[0m  \u001b[9mStrikethrough\u001b[0m\n",
      "\u001b[38;2;96;165;250mTrue-color foreground\u001b[0m\n",
      "\u001b[30;43m Contrasting background \u001b[0m\n",
      "Plain text after reset\n",
    ],
  },
};

export const MixedOutputStreams: Story = {
  args: {
    title: "Build output",
    messages: [
      { id: "start", stream: "stdout", data: "Starting production build…\n" },
      {
        id: "warning",
        stream: "stderr",
        data: "\u001b[33mWarning: bundle exceeds 500 kB\u001b[0m\n",
      },
      {
        id: "done",
        stream: "stdout",
        data: "\u001b[32mBuild completed\u001b[0m\n",
      },
      {
        id: "error",
        stream: "stderr",
        data: "\u001b[31mUpload failed: connection timed out\u001b[0m\n",
      },
    ],
  },
};

const jsonLines = [
  "Receiving structured output…\n",
  '{"event":"build","success":true,"assets":["app.js","app.css"]}\n',
  '[{"name":"API","healthy":true},{"name":"Worker","healthy":false}]\n',
  "{this is not valid JSON}\n",
];

export const StructuredJsonOutput: Story = {
  args: {
    title: "JSON inspection",
    parseStructuredOutput: true,
    messages: jsonLines,
  },
};

export const RawJsonOutput: Story = {
  args: {
    title: "Raw JSON text",
    parseStructuredOutput: false,
    messages: jsonLines,
  },
};

export const SplitChunksAndLineEndings: Story = {
  args: {
    title: "Chunk boundaries",
    subtitle: "CRLF can span entries; carriage returns replace progress",
    messages: [
      { id: "part-2", stream: "stdout", data: "Downloading dependency\r" },
      { id: "part-3", stream: "stdout", data: "\n" },
      { id: "progress-1", stream: "stdout", data: "Processing: 10%" },
      { id: "progress-2", stream: "stdout", data: "\rProcessing: 100%\n" },
      { id: "complete", stream: "stdout", data: "Complete\n" },
    ],
  },
};

function ClearableOutputStory(args: ConsoleAnsiModeProps) {
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

export const ClearAndRestore: Story = {
  render: (args) => <ClearableOutputStory {...args} />,
  args: {
    title: "Clear and restore",
    subtitle: "Use the header actions menu to clear the output",
    emptyMessage: "Output cleared. Restore it with the button above.",
    messages: [
      "First line\n",
      "Second line\n",
      "\u001b[32mTask complete\u001b[0m\n",
    ],
  },
};

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
