import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleTranslations,
} from "@moyarich/console";

const messages: ConsoleMessageData[] = [
  { method: "log", depth: 0, data: ["Application started", { ready: true }] },
  { method: "warn", depth: 0, data: ["Connection retry scheduled"] },
];

function LocalesExample() {
  const [locale, setLocale] = useState("es-MX");
  const [custom, setCustom] = useState(false);
  const [visible, setVisible] = useState(messages);
  const translations: ConsoleTranslations | undefined = custom
    ? { actions: "My custom actions", clear: "Remove output" }
    : undefined;

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 850 }}>
      <label>
        Locale{" "}
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          <option value="en">English</option>
          <option value="es-MX">Español (México)</option>
          <option value="fr-CA">Français (Canada)</option>
          <option value="pt-BR">Português (Brasil)</option>
          <option value="pt-PT">Português (Portugal)</option>
          <option value="de">Deutsch (English fallback)</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={custom}
          onChange={(event) => setCustom(event.target.checked)}
        />
        Override action labels
      </label>
      <Console
        locale={locale}
        translations={translations}
        messages={visible}
        onClear={() => setVisible([])}
        style={{ width: "100%", minHeight: 300 }}
      />
    </div>
  );
}

const meta = {
  title: "Internationalization/Console",
  component: LocalesExample,
} satisfies Meta<typeof LocalesExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Locales: Story = {};
