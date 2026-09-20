import { describe, expect, it } from "vitest";
import {
  createConsoleEventEmitter,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";

describe("createConsoleProxy", () => {
  it("captures messages and group depth", () => {
    const messages: ConsoleMessageData[] = [];
    const console = createConsoleProxy(messages);

    console.log("root");
    console.group("group");
    console.warn("nested");
    console.groupEnd();

    expect(messages.map(({ method, depth }) => ({ method, depth }))).toEqual([
      { method: "log", depth: 0 },
      { method: "group", depth: 0 },
      { method: "warn", depth: 1 },
    ]);
  });

  it("emits clear through a ConsoleEventEmitter", () => {
    const events = createConsoleEventEmitter();
    const received: string[] = [];

    events.on("message", () => received.push("message"));
    events.on("clear", () => received.push("clear"));

    const console = createConsoleProxy({ events });

    console.log("one");
    console.clear();

    expect(received).toEqual(["message", "clear"]);
  });
});
