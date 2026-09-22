import { meta as sharedMeta, Story } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
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
