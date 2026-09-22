import PyodideTqdmProgressExample from "../apps/playground/src/examples/10-ansi/06-pyodide-tqdm-progress/example";
import { meta as sharedMeta, Story } from "./ConsoleAnsi.shared";
const meta = { ...sharedMeta, title: "Console/ANSI Process Output" };
export default meta;
export const PyodideTqdmBrowserRuntime: Story = {
  render: () => <PyodideTqdmProgressExample />,
  args: {
    messages: [],
  },
};
