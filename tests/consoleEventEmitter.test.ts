import { describe, expect, it, vi } from "vitest";
import {
  createConsoleEventEmitter,
  type ConsoleMessageData,
} from "@moyarich/console";

const message: ConsoleMessageData = {
  method: "log",
  data: ["hello"],
  depth: 0,
};

describe("createConsoleEventEmitter", () => {
  it("emits typed message events", () => {
    const events = createConsoleEventEmitter();
    const first = vi.fn();
    const second = vi.fn();

    events.on("message", first);
    events.on("message", second);
    events.emit("message", message);

    expect(first).toHaveBeenCalledWith(message);
    expect(second).toHaveBeenCalledWith(message);
  });

  it("emits clear without a payload", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();

    events.on("clear", listener);
    events.emit("clear");

    expect(listener).toHaveBeenCalledWith();
  });

  it("returns an unsubscribe function from on", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();
    const off = events.on("message", listener);

    off();
    events.emit("message", message);

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports explicit off", () => {
    const events = createConsoleEventEmitter();
    const listener = vi.fn();

    events.on("message", listener);
    events.off("message", listener);
    events.emit("message", message);

    expect(listener).not.toHaveBeenCalled();
  });

  it("removes listeners by type", () => {
    const events = createConsoleEventEmitter();
    const messageListener = vi.fn();
    const clearListener = vi.fn();

    events.on("message", messageListener);
    events.on("clear", clearListener);
    events.removeAllListeners("message");

    events.emit("message", message);
    events.emit("clear");

    expect(messageListener).not.toHaveBeenCalled();
    expect(clearListener).toHaveBeenCalledOnce();
  });

  it("removes all listeners", () => {
    const events = createConsoleEventEmitter();
    const messageListener = vi.fn();
    const clearListener = vi.fn();

    events.on("message", messageListener);
    events.on("clear", clearListener);
    events.removeAllListeners();

    events.emit("message", message);
    events.emit("clear");

    expect(messageListener).not.toHaveBeenCalled();
    expect(clearListener).not.toHaveBeenCalled();
  });

  it("dispatches ConsoleEvent values through the named emitter API", () => {
    const events = createConsoleEventEmitter();
    const messageListener = vi.fn();
    const clearListener = vi.fn();

    events.on("message", messageListener);
    events.on("clear", clearListener);

    events.dispatch({ type: "message", message });
    events.dispatch({ type: "clear" });

    expect(messageListener).toHaveBeenCalledWith(message);
    expect(clearListener).toHaveBeenCalledWith();
  });

  it("uses a listener snapshot while emitting", () => {
    const events = createConsoleEventEmitter();
    const calls: string[] = [];

    events.on("message", () => {
      calls.push("first");
      events.on("message", () => calls.push("late"));
    });

    events.on("message", () => calls.push("second"));

    events.emit("message", message);
    expect(calls).toEqual(["first", "second"]);

    events.emit("message", message);
    expect(calls).toEqual(["first", "second", "first", "second", "late"]);
  });
});
