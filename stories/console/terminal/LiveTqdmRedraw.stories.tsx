import {
  Console,
  type ConsoleTerminalModeProps,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

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

function LiveTqdmRedrawStory(args: ConsoleTerminalModeProps) {
  const [messages, setMessages] = useState<(ConsoleStdoutEntry | string)[]>([]);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setMessages([...(args.messages ?? [])]);

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
  }, [run, args.messages]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <button type="button" onClick={() => setRun((current) => current + 1)}>
          Replay stream
        </button>
      </div>

      <Console {...args} messages={messages} onClear={() => setMessages([])} />
    </div>
  );
}

const meta = {
  title: "Console/Terminal",
  component: Console,
  args: {
    mode: "terminal",
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
} satisfies Meta<ConsoleTerminalModeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveTqdmRedraw: Story = {
  render: (args) => <LiveTqdmRedrawStory {...args} />,
  args: {
    title: "Live tqdm-style redraw",
    subtitle: "Each leading carriage return replaces the current logical line",
    showHeader: true,
    autoScroll: true,
    outputOverflow: "wrap",
    messages: [],
  },
  argTypes: {
    outputOverflow: { control: "select", options: ["wrap", "scroll"] },
    messages: {
      control: "object",
      description:
        "Initial output. Editing this restarts the stream with these messages.",
    },
    onClear: { control: false },
    mode: { control: false },
  },
};
