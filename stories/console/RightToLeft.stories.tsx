import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";

function RightToLeft() {
  return <Console locale="ar-EG" translations={{
    title: "وحدة التحكم", actions: "إجراءات وحدة التحكم",
    copyObject: "نسخ الكائن", copyOutput: "نسخ المخرجات",
    clear: "مسح وحدة التحكم", emptyConsole: "لا توجد مخرجات بعد",
  }} messages={[{
    id: "rtl-example", method: "log", depth: 0,
    data: ["مرحبا بالعالم", { status: "ready", count: 2 }],
  }]} onClear={() => undefined} style={{ minHeight: 300 }} />;
}
const meta = { title: "Console/Internationalization", component: RightToLeft } satisfies Meta<typeof RightToLeft>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RTL: Story = {};
