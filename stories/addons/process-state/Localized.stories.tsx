import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
import { createConsoleProcessStateAddon } from "@moyarich/console-addon-process-state";

function LocalizedProcessState() {
  const [locale, setLocale] = useState("pt-BR");
  const addon = useMemo(() => createConsoleProcessStateAddon({ indicator: { locale, showCleared: true } }), [locale]);
  return <div style={{ display: "grid", gap: 12, width: 760, maxWidth: "95vw" }}>
    <label>Addon language{" "}<select value={locale} onChange={event => setLocale(event.target.value)}>
      <option value="en">English</option><option value="es-MX">Español</option>
      <option value="fr-CA">Français</option><option value="pt-BR">Português (Brasil)</option>
      <option value="pt-PT">Português (Portugal)</option>
    </select></label>
    <Console mode="terminal" messages={["Starting process..."]} addons={[addon]} style={{ width: "100%", height: 300 }} />
  </div>;
}
const meta = { title: "Console/Addons/Process State", component: LocalizedProcessState } satisfies Meta<typeof LocalizedProcessState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Localized: Story = {};
