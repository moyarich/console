import { describe, expect, it } from "vitest";
import {
  createConsoleEventEmitter,
  createConsoleProxy,
  type ConsoleMessageData,
} from "@moyarich/console";

describe("createConsoleProxy", () => {
  it("emits messages and group depth through the event channel", () => {
    const events = createConsoleEventEmitter();
    const messages: ConsoleMessageData[] = [];

    events.on("message", (message) => messages.push(message));

    const console = createConsoleProxy({ events });

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
    const events = createConsoleEventEmitter();
    const messages: ConsoleMessageData[] = [];
    let currentTime = 1000;

    events.on("message", (message) => messages.push(message));

    const console = createConsoleProxy({
      events,
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

  it("emits message and clear through the same event channel", () => {
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
