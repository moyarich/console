import { describe, expect, it } from "vitest";
import { createConsoleProxy, type ConsoleEvent, type ConsoleMessageData } from "@moyarich/console";

describe("createConsoleProxy", () => {
  it("captures messages and group depth", () => {
    const messages: ConsoleMessageData[] = [];
    const proxy = createConsoleProxy(messages);
    proxy.log("root");
    proxy.group("group");
    proxy.warn("nested");
    proxy.groupEnd();

    expect(messages.map(({ method, depth }) => ({ method, depth }))).toEqual([
      { method: "log", depth: 0 },
      { method: "group", depth: 0 },
      { method: "warn", depth: 1 },
    ]);
  });

  it("emits clear as an event", () => {
    const events: ConsoleEvent[] = [];
    const proxy = createConsoleProxy({ onEvent: (event) => events.push(event) });
    proxy.log("one");
    proxy.clear();
    expect(events[0]?.type).toBe("message");
    expect(events[1]).toEqual({ type: "clear" });
  });
});
