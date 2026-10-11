import { useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";
import "@moyarich/console/styles.css";

const messages: ConsoleMessageData[] = [
  {
    id: "result",
    method: "log",
    data: ["Request complete", { status: 200 }],
    depth: 0,
  },
  {
    id: "debug",
    method: "debug",
    data: ["Request timing", { duration: 42 }],
    depth: 0,
  },
];

export default function ComponentFilterExample() {
  const [showDebug, setShowDebug] = useState(false);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label>
        <input
          type="checkbox"
          checked={showDebug}
          onChange={(event) => setShowDebug(event.target.checked)}
        />{" "}
        Show debug messages
      </label>
      <Console
        messages={messages}
        filter={({ message }) => showDebug || message.method !== "debug"}
        title="Host-owned filtering"
      />
    </div>
  );
}
