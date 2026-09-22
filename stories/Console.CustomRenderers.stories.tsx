import {
  customMessageRenderers,
  customValueRenderers,
  meta as sharedMeta,
  Story,
} from "./Console.shared";
const meta = { ...sharedMeta, title: "Console/Console" };
export default meta;
export const CustomRenderers: Story = {
  args: {
    messageRenderers: customMessageRenderers,
    valueRenderers: customValueRenderers,
    messages: [
      {
        method: "info",
        data: [
          "Deployment",
          { kind: "status", label: "API", state: "healthy" },
        ],
        depth: 0,
      },
      {
        method: "log",
        data: ["Default fallback", { untouched: true }],
        depth: 0,
      },
    ],
  },
};
