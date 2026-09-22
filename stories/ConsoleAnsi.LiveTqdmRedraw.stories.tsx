import {
  LiveTqdmRedrawStory,
  meta as sharedMeta,
  Story,
} from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
export const LiveTqdmRedraw: Story = {
  render: () => <LiveTqdmRedrawStory />,
  args: {
    messages: [],
  },
};
