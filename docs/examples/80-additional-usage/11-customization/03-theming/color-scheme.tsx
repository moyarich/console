import type { CSSProperties } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import "@moyarich/console/styles.css";

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
  {
    id: "error",
    method: "error",
    data: ["Request failed", { status: 503 }],
    depth: 0,
  },
];

const theme = {
  colorScheme: "dark",
} satisfies CSSProperties;

export default function ColorSchemeExample() {
  return (
    <div style={theme}>
      <Console
        messages={messages}
        title="Inherited dark color scheme"
        subtitle="Built-in light-dark() defaults follow the standard color-scheme property."
      />
    </div>
  );
}
