import { useState } from "react";
import { Console, type ConsoleMessageData } from "@moyarich/console";

const messages: ConsoleMessageData[] = Array.from(
  { length: 120 },
  (_, index) => ({
    id: `output-${index}`,
    method: index % 17 === 0 ? "warn" : "log",
    depth: 0,
    data: [
      `Build step ${index + 1}: ${index % 17 === 0 ? "Review warning" : "Completed"}`,
    ],
  }),
);

export default function Example() {
  const [announcementMode, setAnnouncementMode] = useState<
    "off" | "polite" | "assertive"
  >("off");
  const [count, setCount] = useState(15);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label>
        Screen-reader announcements:{" "}
        <select
          value={announcementMode}
          onChange={(event) =>
            setAnnouncementMode(event.target.value as typeof announcementMode)
          }
        >
          <option value="off">Off (recommended for high-volume output)</option>
          <option value="polite">Polite</option>
          <option value="assertive">Assertive (critical updates only)</option>
        </select>
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            setCount((current) => Math.min(messages.length, current + 25))
          }
        >
          Append 25 entries
        </button>
        <button type="button" onClick={() => setCount(15)}>
          Reset
        </button>
      </div>
      <Console
        messages={messages.slice(0, count)}
        announcementMode={announcementMode}
        outputLabel="Accessible build output"
      />
    </div>
  );
}
