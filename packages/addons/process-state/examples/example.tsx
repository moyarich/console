import { useMemo, useState } from "react";
import { Console } from "@moyarich/console";
import { createConsoleProcessStateAddon } from "@moyarich/console-addon-process-state";

const BEL = "\u0007";
const OSC = (state: number, percent?: number) =>
  `\u001b]9;4;${state}${percent === undefined ? "" : `;${percent}`}${BEL}`;

const controls = [
  { label: "Start · 15%", state: 1, percent: 15 },
  { label: "Progress · 75%", state: 1, percent: 75 },
  { label: "Clamp · 150%", state: 1, percent: 150 },
  { label: "Indeterminate", state: 3 },
  { label: "Paused", state: 4, percent: 0 },
  { label: "Error", state: 2, percent: 0 },
  { label: "Complete · 100%", state: 1, percent: 100 },
  { label: "Clear", state: 0 },
] as const;

export default function Example() {
  const addon = useMemo(
    () => createConsoleProcessStateAddon({ indicator: true }),
    [],
  );
  const [messages, setMessages] = useState<string[]>([
    "Process started. Select a progress state below.\n",
    "\u001b]9;9;/workspace\u001b\\",
    OSC(1, 15),
  ]);

  const send = (state: number, percent?: number) => {
    setMessages((entries) => [...entries, OSC(state, percent)]);
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {controls.map(({ label, state, ...rest }) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              send(state, "percent" in rest ? rest.percent : undefined)
            }
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setMessages(["Process reset.\n"])}>
          Reset
        </button>
      </div>
      <Console mode="terminal" messages={messages} addons={[addon]} />
    </div>
  );
}
