import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, createConsoleFormatters } from "@moyarich/console";

function RegionalFormatting() {
  const [locale, setLocale] = useState("en-US");
  const f = createConsoleFormatters(locale);
  const sample = new Date("2026-10-28T12:00:00Z");
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 850 }}>
      <label>
        Formatting locale{" "}
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          <option value="en-US">English (US)</option>
          <option value="de-DE">Deutsch (Deutschland)</option>
          <option value="fr-FR">Français (France)</option>
          <option value="ar-EG">العربية (مصر)</option>
        </select>
      </label>
      <Console
        locale={locale}
        messages={[
          {
            id: "formatted",
            method: "info",
            depth: 0,
            data: [
              {
                formattedNumber: f.number(1234567.89),
                formattedDate: f.date(sample, {
                  dateStyle: "long",
                  timeZone: "UTC",
                }),
                formattedRelativeTime: f.relativeTime(-2, "hours"),
              },
            ],
          },
        ]}
        style={{ minHeight: 290 }}
      />
      <p>
        Display formatting uses Intl; original application data is not mutated.
      </p>
    </div>
  );
}
const meta = {
  title: "Internationalization/Console",
  component: RegionalFormatting,
} satisfies Meta<typeof RegionalFormatting>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Regions: Story = {};
