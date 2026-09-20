import { describe, expect, it, vi } from "vitest";
import {
  createConsoleEventChannel,
  type ConsoleEvent,
} from "@moyarich/console";

const logEvent: ConsoleEvent = {
  type: "message",
  message: {
    method: "log",
    data: ["hello"],
    depth: 0,
  },
};

describe("createConsoleEventChannel", () => {
  it("fans one console event out to multiple subscribers", () => {
    const channel = createConsoleEventChannel();
    const first = vi.fn();
    const second = vi.fn();

    channel.subscribe(first);
    channel.subscribe(second);
    channel.emit(logEvent);

    expect(first).toHaveBeenCalledWith(logEvent);
    expect(second).toHaveBeenCalledWith(logEvent);
  });

  it("returns an unsubscribe function for each subscriber", () => {
    const channel = createConsoleEventChannel();
    const listener = vi.fn();
    const unsubscribe = channel.subscribe(listener);

    unsubscribe();
    channel.emit(logEvent);

    expect(listener).not.toHaveBeenCalled();
  });

  it("can remove all subscribers without changing producers", () => {
    const channel = createConsoleEventChannel();
    const first = vi.fn();
    const second = vi.fn();

    channel.subscribe(first);
    channel.subscribe(second);
    channel.clear();
    channel.emit(logEvent);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it("uses a listener snapshot while emitting", () => {
    const channel = createConsoleEventChannel();
    const calls: string[] = [];

    channel.subscribe(() => {
      calls.push("first");
      channel.subscribe(() => calls.push("late"));
    });
    channel.subscribe(() => calls.push("second"));

    channel.emit(logEvent);
    expect(calls).toEqual(["first", "second"]);

    channel.emit(logEvent);
    expect(calls).toEqual(["first", "second", "first", "second", "late"]);
  });
});
