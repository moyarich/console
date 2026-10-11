import { useState } from "react";
import {
  Console,
  type ConsoleMessageData,
  type ConsoleValueDisplay,
  type ConsoleValueRenderer,
} from "@moyarich/console";

const circular: Record<string, unknown> = { name: "Cycle" };
circular.self = circular;

// Keep the same message objects while switching display modes.
const messages: ConsoleMessageData[] = [
  {
    id: "object",
    method: "log",
    depth: 0,
    data: ["User", { name: "Moya", roles: ["developer", "admin"] }],
  },
  {
    id: "array",
    method: "log",
    depth: 0,
    data: [[1, 2, { ok: true }], null, false, 42],
  },
  {
    id: "circular",
    method: "log",
    depth: 0,
    data: [circular],
  },
  { id: "dir", method: "dir", depth: 0, data: [{ nested: { count: 3 } }] },
  {
    id: "table",
    method: "table",
    depth: 0,
    data: [[{ item: "First", count: 2 }, { item: "Second", count: 4 }]],
  },
  {
    id: "custom",
    method: "log",
    depth: 0,
    data: [{ special: true }],
  },
];

const customRenderers: ConsoleValueRenderer[] = [
  {
    type: "Object",
    match: ({ value }) =>
      typeof value === "object" &&
      value !== null &&
      "special" in value,
    render: () => <strong>Custom object renderer</strong>,
  },
];

export default function Example() {
  const [valueDisplay, setValueDisplay] =
    useState<ConsoleValueDisplay>("structured");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label>
        Value display:{" "}
        <select
          value={valueDisplay}
          onChange={(event) =>
            setValueDisplay(event.target.value as ConsoleValueDisplay)
          }
        >
          <option value="structured">Structured</option>
          <option value="string">String</option>
        </select>
      </label>
      <Console
        messages={messages}
        valueDisplay={valueDisplay}
        valueRenderers={customRenderers}
      />
    </div>
  );
}
