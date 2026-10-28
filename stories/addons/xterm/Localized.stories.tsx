import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
import { createConsoleXtermAddon } from "@moyarich/console-addon-xterm";

function LocalizedAddon() {
  const [locale, setLocale] = useState("es-MX");
  const addon = useMemo(() => createConsoleXtermAddon({ locale }), [locale]);
  return <div style={{ display: "grid", gap: 12, width: 780, maxWidth: "94vw" }}>
    <label>Addon language{" "}
      <select value={locale} onChange={event => setLocale(event.target.value)}>
        <option value="en">English</option>
        <option value="es-MX">Español</option>
        <option value="fr-CA">Français</option>
      </select>
    </label>
    <Console locale={locale} mode="terminal" messages={["Terminal ready\\n"]} addons={[addon]} style={{ width: "100%", height: 330 }} />
  </div>;
}
const meta = { title: "Console/Addons/xterm", component: LocalizedAddon } satisfies Meta<typeof LocalizedAddon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Localized: Story = {};
