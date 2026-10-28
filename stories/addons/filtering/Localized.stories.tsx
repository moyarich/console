import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleFilteringAddon, createConsoleFilteringController } from "@moyarich/console-addon-filtering";

const entries: ConsoleMessageData[] = [
  { id: "a", method: "info", depth: 0, source: "app", data: ["Request complete"] },
  { id: "b", method: "error", depth: 0, source: "api", data: ["Request failed"] },
];

function LocalizedFiltering() {
  const [locale, setLocale] = useState("es-MX");
  const controller = useMemo(() => createConsoleFilteringController(), []);
  const addon = useMemo(() => createConsoleFilteringAddon({ controller, controls: { locale } }), [locale, controller]);
  return <div style={{ display: "grid", gap: 12, width: 760, maxWidth: "95vw" }}>
    <label>Locale{" "}
      <select value={locale} onChange={(event) => setLocale(event.target.value)}>
        <option value="en-US">English</option>
        <option value="es-MX">Español</option>
        <option value="fr-CA">Français</option>
        <option value="pt-BR">Português (Brasil)</option>
        <option value="pt-PT">Português (Portugal)</option>
      </select>
    </label>
    <Console locale={locale} messages={entries} addons={[addon]} style={{ height: 340, width: "100%" }} />
  </div>;
}

const meta = { title: "Console/Addons/Filtering", component: LocalizedFiltering } satisfies Meta<typeof LocalizedFiltering>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Localized: Story = {};
