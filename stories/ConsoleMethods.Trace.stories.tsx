import {
  Story,
  methodStory,
  meta as sharedMeta,
} from "./ConsoleMethods.shared";
const meta = { ...sharedMeta, title: "Console/Console methods" };
export default meta;
export const Trace: Story = { ...methodStory("trace"), name: "console.trace" };
