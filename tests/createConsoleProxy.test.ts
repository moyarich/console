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

  it("tracks console.time and console.timeEnd", () => {
    const messages: ConsoleMessageData[] = [];
    let currentTime = 1000;
    const console = createConsoleProxy({
      messages,
      timerNow: () => currentTime,
    });

    console.time("Timer");
    currentTime = 1250;
    console.timeEnd("Timer");

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      method: "timeEnd",
      data: ["Timer: 250.00 ms"],
    });
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
