import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
import de from "../../packages/console/src/locales/en.json";

/** External JSON dictionaries can override just the labels an app needs. */
function CustomJsonLocale() {
  const overrides = {
    ...de,
    title: "Protokoll",
    actions: "Konsolenaktionen",
    clear: "Konsole leeren",
  };
  return (
    <Console
      locale="de-DE"
      translations={overrides}
      messages={[
        {
          id: "json-locale",
          method: "info",
          depth: 0,
          data: ["This log payload remains unchanged."],
        },
      ]}
      onClear={() => undefined}
      style={{ minHeight: 280 }}
    />
  );
}
const meta = {
  title: "Internationalization/Console",
  component: CustomJsonLocale,
} satisfies Meta<typeof CustomJsonLocale>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CustomJson: Story = {};
