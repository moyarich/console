import { meta as sharedMeta, Story, tqdmChunks } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
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
