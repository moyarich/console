import { describe, expect, it } from "vitest";
import {
  createConsoleEventChannel,
  createConsoleProxy,
  type ConsoleEvent,
  type ConsoleMessageData,
} from "@moyarich/console";

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

  it("emits clear through a ConsoleEventChannel", () => {
    const received: ConsoleEvent[] = [];
    const events = createConsoleEventChannel();

    events.subscribe((event) => received.push(event));

    const proxy = createConsoleProxy({ events });

    proxy.log("one");
    proxy.clear();

    expect(received[0]?.type).toBe("message");
    expect(received[1]).toEqual({ type: "clear" });
  });
});
