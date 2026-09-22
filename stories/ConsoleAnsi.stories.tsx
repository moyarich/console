import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
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
        throw new Error(`Stale tqdm progress frame remained visible: ${staleFrame}`);
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
