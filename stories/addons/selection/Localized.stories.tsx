import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
import { createConsoleSelectionAddon } from "@moyarich/console-addon-selection";

function LocalizedSelection() {
  const [locale, setLocale] = useState("fr-CA");
  const addon = useMemo(() => createConsoleSelectionAddon({ locale }), [locale]);
  return <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
    <label>Addon language{" "}<select value={locale} onChange={e => setLocale(e.target.value)}>
      <option value="en">English</option><option value="es-MX">Español</option><option value="fr-CA">Français</option>
        <option value="pt-BR">Português (Brasil)</option>
        <option value="pt-PT">Português (Portugal)</option>
    </select></label>
    <Console locale={locale} addons={[addon]} messages={[{ id: "selection-1", method: "log", depth: 0, data: ["Right-click the message to toggle selection"] }]} style={{ height: 330, width: "100%" }} />
  </div>;
}
const meta = { title: "Console/Addons/Selection", component: LocalizedSelection } satisfies Meta<typeof LocalizedSelection>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Localized: Story = {};
