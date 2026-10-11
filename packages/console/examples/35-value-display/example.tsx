import { useState } from "react";
import { Console, type ConsoleMessageData, type ConsoleValueDisplay } from "@moyarich/console";

const messages: ConsoleMessageData[] = [
  { id: "object", method: "log", depth: 0, data: ["User", { name: "Moya", roles: ["developer", "admin"] }] },
  { id: "array", method: "log", depth: 0, data: [[1, 2, { ok: true }], null, false] },
  { id: "dir", method: "dir", depth: 0, data: [{ nested: { count: 3 } }] },
  { id: "table", method: "table", depth: 0, data: [[{ item: "First", count: 2 }, { item: "Second", count: 4 }]] },
];

export default function Example() {
  const [valueDisplay, setValueDisplay] = useState<ConsoleValueDisplay>("structured");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label>
        Value display:{" "}
        <select value={valueDisplay} onChange={(event) => setValueDisplay(event.target.value as ConsoleValueDisplay)}>
          <option value="structured">Structured</option>
          <option value="string">String</option>
        </select>
      </label>
      <Console messages={messages} valueDisplay={valueDisplay} />
    </div>
  );
}
