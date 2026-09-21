import { describe, expect, it } from "vitest";
import {
  createConsoleEventEmitter,
  createConsoleProxy,
  type ConsoleEvent,
} from "@moyarich/console";

function getMessages(events: ConsoleEvent[]) {
  return events.flatMap((event) =>
    event.type === "message" ? [event.message] : [],
  );
}

describe("createConsoleProxy", () => {
  it("emits messages and group depth through onEvent", () => {
    const received: ConsoleEvent[] = [];
    const console = createConsoleProxy({
      onEvent: (event) => received.push(event),
    });

    console.log("root");
    console.group("group");
    console.warn("nested");
    console.groupEnd();

    expect(
      getMessages(received).map(({ method, depth }) => ({ method, depth })),
    ).toEqual([
      { method: "log", depth: 0 },
      { method: "group", depth: 0 },
      { method: "warn", depth: 1 },
    ]);
  });

  it("tracks console.time and console.timeEnd", () => {
    const received: ConsoleEvent[] = [];
    let currentTime = 1000;
    const console = createConsoleProxy({
      onEvent: (event) => received.push(event),
      timerNow: () => currentTime,
    });

    console.time("Timer");
    currentTime = 1250;
    console.timeEnd("Timer");

    expect(getMessages(received)).toHaveLength(1);
    expect(getMessages(received)[0]).toMatchObject({
      method: "timeEnd",
      data: ["Timer: 250.00 ms"],
    });
  });

  it("can dispatch proxy events through a ConsoleEventEmitter", () => {
    const events = createConsoleEventEmitter();
    const received: string[] = [];

    events.on("message", () => received.push("message"));
    events.on("clear", () => received.push("clear"));

    const console = createConsoleProxy({
      onEvent: events.dispatch,
    });

    console.log("one");
    console.clear();

    expect(received).toEqual(["message", "clear"]);
  });
});
