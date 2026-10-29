import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "@moyarich/console";
import { createConsoleDataExportAddon } from "@moyarich/console-addon-data-export";

function LocalizedExport() {
  const [locale, setLocale] = useState("es-MX");
  const addon = useMemo(
    () => createConsoleDataExportAddon({ locale }),
    [locale],
  );
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
      <label>
        Addon language{" "}
        <select value={locale} onChange={(e) => setLocale(e.target.value)}>
          <option value="en">English</option>
          <option value="es-MX">Español</option>
          <option value="fr-CA">Français</option>
          <option value="pt-BR">Português (Brasil)</option>
          <option value="pt-PT">Português (Portugal)</option>
        </select>
      </label>
      <Console
        locale={locale}
        addons={[addon]}
        messages={[
          {
            id: "export-1",
            method: "info",
            depth: 0,
            data: ["Open actions to see localized export commands"],
          },
        ]}
        style={{ height: 330, width: "100%" }}
      />
    </div>
  );
}
const meta = {
  title: "Internationalization/Addons/Data Export",
  component: LocalizedExport,
} satisfies Meta<typeof LocalizedExport>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Localized: Story = {};
