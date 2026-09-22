import {
  meta as sharedMeta,
  Story,
  StreamingAnsiStory,
} from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
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
