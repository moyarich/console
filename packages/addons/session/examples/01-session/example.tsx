import { useMemo, useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import { createConsoleSessionAddon, parseConsoleSession } from "@moyarich/console-addon-session";

const initial: ConsoleMessageData[] = [
  { id: "startup", method: "info", depth: 0, data: ["Server started"] },
  { id: "response", method: "log", depth: 0, data: [{ status: 200, success: true }] },
];

export default function Example() {
  const addon = useMemo(() => createConsoleSessionAddon(), []);
  const [messages, setMessages] = useState<ConsoleMessageData[]>(initial);
  const [saved, setSaved] = useState("");
  return <div style={{ display: "grid", gap: 8 }}>
    <div style={{ display: "flex", gap: 8 }}>
      <button type="button" onClick={() => setSaved(addon.service.save())}>Save session</button>
      <button type="button" onClick={() => setMessages([])}>Clear displayed messages</button>
      <button type="button" disabled={!saved} onClick={() => {
        const session = parseConsoleSession(saved);
        if (session.mode === "console") setMessages([...session.messages]);
      }}>Restore session</button>
    </div>
    <Console messages={messages} addons={[addon]} />
    <textarea readOnly aria-label="Saved session JSON" rows={5} value={saved} />
  </div>;
}
