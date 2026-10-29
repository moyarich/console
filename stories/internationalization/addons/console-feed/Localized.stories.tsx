import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
import { createConsoleFeedAddon } from "@moyarich/console-addon-console-feed";

function LocalizedAddon() {
  const [locale, setLocale] = useState("es-MX");
  const addon = useMemo(() => createConsoleFeedAddon({ locale }), [locale]);
  return (
    <div style={{ display: "grid", gap: 12, width: 780, maxWidth: "94vw" }}>
      <label>
        Addon language{" "}
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          <option value="en">English</option>
          <option value="es-MX">Español</option>
          <option value="fr-CA">Français</option>
          <option value="pt-BR">Português (Brasil)</option>
          <option value="pt-PT">Português (Portugal)</option>
        </select>
      </label>
      <Console
        locale={locale}
        messages={[
          {
            id: "message-1",
            method: "info",
            depth: 0,
            data: ["Message content is preserved"],
          },
        ]}
        addons={[addon]}
        style={{ width: "100%", height: 330 }}
      />
    </div>
  );
}
const meta = {
  title: "Internationalization/Addons/Console Feed",
  component: LocalizedAddon,
} satisfies Meta<typeof LocalizedAddon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Localized: Story = {};
