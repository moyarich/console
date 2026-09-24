import type { CSSProperties } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import "@moyarich/console/styles.css";

type ConsoleThemeStyle = CSSProperties &
  Partial<Record<`--console-${string}`, string>>;

const messages: ConsoleMessageData[] = [
  {
    id: "ready",
    method: "info",
    data: ["Application ready", { mode: "dark" }],
    depth: 0,
  },
  {
    id: "warning",
    method: "warn",
    data: ["Cache nearing capacity", { usage: "86%" }],
    depth: 0,
  },
];

const theme: ConsoleThemeStyle = {
  "--console-color-scheme": "dark",
  "--console-context-menu-color-scheme": "dark",
  "--console-panel-background-color": "#111827",
  "--console-panel-color": "#f8fafc",
  "--console-background-color": "#0f172a",
  "--console-color": "#e2e8f0",
};

export default function ColorSchemeExample() {
  return (
    <div style={theme}>
      <Console
        messages={messages}
        title="Inherited dark theme"
        subtitle="Theme variables can be inherited from a host container."
      />
    </div>
  );
}
