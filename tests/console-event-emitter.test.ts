import { describe, expect, it, vi } from "vitest";
import { createConsoleEventEmitter } from "../packages/console/src/utils/events/createConsoleEventEmitter";

describe("Console EventEmitter3 events", () => {
  it("follows Node-style chaining, emission, and listener removal", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();
    const message = { method: "log" as const, data: ["hello"], depth: 0 };

    expect(events.on("message", listener)).toBe(events);
    expect(events.emit("message", message)).toBe(true);
    expect(listener).toHaveBeenCalledExactlyOnceWith(message);
    expect(events.off("message", listener)).toBe(events);
    expect(events.emit("message", message)).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("supports once() and listenerCount()", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();
    expect(events.once("clear", listener)).toBe(events);
    expect(events.listenerCount("clear")).toBe(1);
    events.emit("clear");
    events.emit("clear");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(events.listenerCount("clear")).toBe(0);
  });

  it("allows repeated registrations, matching Node.js EventEmitter", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();
    events.on("clear", listener).on("clear", listener);
    events.emit("clear");
    expect(listener).toHaveBeenCalledTimes(2);
    // EventEmitter3 removes every matching registration for the same function.
    expect(events.off("clear", listener)).toBe(events);
    expect(events.listenerCount("clear")).toBe(0);
    expect(events.emit("clear")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("removes listeners by event name or globally", () => {
    const events = createConsoleEventEmitter();
    const messageListener = vi.fn();
    const clearListener = vi.fn();
    events.on("message", messageListener).on("clear", clearListener);
    expect(events.removeAllListeners("message")).toBe(events);
    expect(events.emit("message", { method: "log", data: [], depth: 0 })).toBe(
      false,
    );
    expect(events.emit("clear")).toBe(true);
    expect(messageListener).not.toHaveBeenCalled();
    expect(clearListener).toHaveBeenCalledOnce();
    events.removeAllListeners();
    expect(events.emit("clear")).toBe(false);
  });

  it("isolates event instances", () => {
    const one = createConsoleEventEmitter();
    const two = createConsoleEventEmitter();
    const listener = vi.fn();
    one.on("clear", listener);
    two.emit("clear");
    expect(listener).not.toHaveBeenCalled();
  });
});
