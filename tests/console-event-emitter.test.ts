import { describe, expect, it, vi } from "vitest";
import { createConsoleEventEmitter } from "../../packages/console/src/utils/events/createConsoleEventEmitter";

describe("createConsoleEventEmitter (EventEmitter3 adapter)", () => {
  it("delivers typed messages and supports unsubscribe", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();
    const message = { method: "log" as const, data: ["hello"], depth: 0 };
    const unsubscribe = events.on("message", listener);

    events.emit("message", message);
    expect(listener).toHaveBeenCalledExactlyOnceWith(message);

    unsubscribe();
    events.emit("message", message);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("deduplicates a listener and allows re-subscription after off", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();
    events.on("clear", listener);
    events.on("clear", listener);

    events.emit("clear");
    expect(listener).toHaveBeenCalledTimes(1);

    events.off("clear", listener);
    events.emit("clear");
    expect(listener).toHaveBeenCalledTimes(1);

    events.on("clear", listener);
    events.emit("clear");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("supports removal of a single event or all events", () => {
    const events = createConsoleEventEmitter();
    const messageListener = vi.fn();
    const clearListener = vi.fn();
    events.on("message", messageListener);
    events.on("clear", clearListener);

    events.removeAllListeners("message");
    events.emit("message", { method: "log", data: ["ignored"], depth: 0 });
    events.emit("clear");
    expect(messageListener).not.toHaveBeenCalled();
    expect(clearListener).toHaveBeenCalledTimes(1);

    events.removeAllListeners();
    events.emit("clear");
    expect(clearListener).toHaveBeenCalledTimes(1);
  });

  it("permits unsubscribing while dispatching", () => {
    const events = createConsoleEventEmitter();
    const second = vi.fn();
    events.on("clear", () => events.off("clear", second));
    events.on("clear", second);

    events.emit("clear");
    expect(second).toHaveBeenCalledTimes(1);
    events.emit("clear");
    expect(second).toHaveBeenCalledTimes(1);
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
