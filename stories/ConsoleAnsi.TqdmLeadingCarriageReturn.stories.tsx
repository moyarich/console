import {
  Console,
  type ConsoleAnsiModeProps,
  type ConsoleStdoutEntry,
} from "@moyarich/console";
import type { Meta, StoryObj } from "@storybook/react-vite";

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
