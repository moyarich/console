import { describe, expect, it, vi } from "vitest";
import {
  captureConsole,
  createConsoleEventEmitter,
  type ConsoleMessageData,
} from "@moyarich/console";

describe("captureConsole", () => {
  it("captures a supplied consoleTarget and restores it", () => {
    const events = createConsoleEventEmitter();
    const received: ConsoleMessageData[] = [];
    const originalLog = vi.fn();
    const consoleTarget = {
      log: originalLog,
    } as unknown as Console;

    events.on("message", (message) => {
      received.push(message);
    });

    const restore = captureConsole({
      events,
      consoleTarget,
      source: "custom-console",
      passThrough: true,
    });

    consoleTarget.log("captured", { ready: true });

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      method: "log",
      data: ["captured", { ready: true }],
      source: "custom-console",
    });
    expect(originalLog).toHaveBeenCalledWith("captured", { ready: true });

    restore();
    consoleTarget.log("after restore");

    expect(received).toHaveLength(1);
    expect(originalLog).toHaveBeenCalledWith("after restore");
  });
});
