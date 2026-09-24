import type { CSSProperties } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import "@moyarich/console/styles.css";

type ConsoleThemeStyle = CSSProperties &
  Partial<Record<`--console-${string}`, string>>;

const messages: ConsoleMessageData[] = [
  {
    id: "preferences",
    method: "log",
    data: ["Preferences loaded", { locale: "en-US" }],
    depth: 0,
  },
  {
    id: "request-error",
    method: "error",
    data: ["Request failed", { status: 503 }],
    depth: 0,
  },
];

const theme: ConsoleThemeStyle = {
  "--console-panel-background-color": "#ffffff",
  "--console-panel-color": "#172033",
  "--console-panel-border": "1px solid #d8dee8",
  "--console-background-color": "#f8fafc",
  "--console-color": "#172033",
  "--console-string-color": "#b42318",
  "--console-number-color": "#175cd3",
  "--console-error-background-color": "#fef3f2",
  "--console-error-color": "#912018",
};

export default function CustomTokensExample() {
  return (
    <div style={theme}>
      <Console
        messages={messages}
        title="Custom theme tokens"
        subtitle="Override only the CSS variables your host needs."
      />
    </div>
  );
}
