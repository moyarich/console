import { describe, expect, it } from "vitest";
import { appendConsoleRetainedMessage } from "../packages/console/src/hooks/useConsoleMessages";
import type { ConsoleMessageData } from "@moyarich/console";

function message(id: string): ConsoleMessageData {
  return { id, method: "log", depth: 0, data: [id] };
}

describe("bounded Console history", () => {
  it("retains only the newest entries and tracks single and multiple trims", () => {
    let history = {
      messages: [message("1"), message("2"), message("3")],
      droppedCount: 0,
    };
    history = appendConsoleRetainedMessage(history, message("4"), 3);
    expect(history.messages.map((entry) => entry.id)).toEqual(["2", "3", "4"]);
    expect(history.droppedCount).toBe(1);
    history = appendConsoleRetainedMessage(history, message("5"), 1);
    expect(history.messages.map((entry) => entry.id)).toEqual(["5"]);
    expect(history.droppedCount).toBe(4);
  });
  it("does not count deduplicated entries as dropped", () => {
    const history = { messages: [message("same")], droppedCount: 5 };
    expect(appendConsoleRetainedMessage(history, message("same"), 1)).toBe(
      history,
    );
  });
  it("supports zero retention", () => {
    const next = appendConsoleRetainedMessage(
      { messages: [], droppedCount: 0 },
      message("new"),
      0,
    );
    expect(next.messages).toEqual([]);
    expect(next.droppedCount).toBe(1);
  });
});
