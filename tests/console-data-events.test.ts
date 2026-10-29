import { describe, expect, it, vi } from "vitest";
import { createConsoleDataController } from "../packages/console/src/data";
import { createConsoleEventEmitter } from "../packages/console/src/utils/events/createConsoleEventEmitter";

describe("isolated Console event channels", () => {
  it("never delivers messages from one console producer to another", () => {
    const first = createConsoleEventEmitter();
    const second = createConsoleEventEmitter();
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    first.on("message", firstListener);
    second.on("message", secondListener);
    const message = { method: "log" as const, data: ["first"], depth: 0 };
    first.emit("message", message);
    expect(firstListener).toHaveBeenCalledExactlyOnceWith(message);
    expect(secondListener).not.toHaveBeenCalled();
    first.off("message", firstListener);
    second.off("message", secondListener);
  });

  it("isolates persistence-facing data subscriptions and disposes listeners", () => {
    const first = createConsoleDataController("console");
    const second = createConsoleDataController("console");
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const subscription = first.subscribe(firstListener);
    second.subscribe(secondListener);
    first.setSnapshot({ mode: "console", all: [], visible: [] });
    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).not.toHaveBeenCalled();
    subscription.dispose();
    first.setSnapshot({ mode: "console", all: [], visible: [] });
    expect(firstListener).toHaveBeenCalledTimes(1);
    second.setSnapshot({ mode: "console", all: [], visible: [] });
    expect(secondListener).toHaveBeenCalledTimes(1);
  });
});
