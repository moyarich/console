import { describe, expect, it } from "vitest";
import {
  createConsoleEnvelope,
  createConsolePostMessageSender,
  createConsoleWebSocketSender,
  isConsoleEnvelope,
  listenForConsoleWebSocket,
  serializeConsoleValue,
  type ConsoleEvent,
  type ConsoleWebSocketLike,
} from "@moyarich/console";

describe("console transport", () => {
  const event: ConsoleEvent = {
    type: "message",
    message: { method: "log", data: ["hello", { ok: true }], depth: 0 },
  };

  it("creates versioned envelopes", () => {
    const envelope = createConsoleEnvelope(event, "test");
    expect(isConsoleEnvelope(envelope)).toBe(true);
    expect(envelope.channel).toBe("test");
  });

  it("serializes values that JSON cannot represent directly", () => {
    const value = serializeConsoleValue({ big: 10n, missing: undefined, fn() {} });
    expect(value).toEqual({ big: "10n", missing: "[undefined]", fn: "[Function fn]" });
  });

  it("sends postMessage envelopes", () => {
    const sent: unknown[] = [];
    const send = createConsolePostMessageSender({
      targetWindow: { postMessage: (message) => sent.push(message) },
      channel: "iframe",
    });
    send(event);
    expect(sent).toHaveLength(1);
    expect(isConsoleEnvelope(sent[0])).toBe(true);
  });

  it("sends and receives WebSocket envelopes", () => {
    const listeners = new Set<(event: MessageEvent) => void>();
    const received: ConsoleEvent[] = [];
    const sent: string[] = [];
    const socket: ConsoleWebSocketLike = {
      send(data) { sent.push(data); },
      addEventListener(_type, listener) { listeners.add(listener); },
      removeEventListener(_type, listener) { listeners.delete(listener); },
    };

    const stop = listenForConsoleWebSocket({ socket, channel: "server", onEvent: (value) => received.push(value) });
    createConsoleWebSocketSender({ socket, channel: "server" })(event);
    for (const listener of listeners) listener({ data: sent[0] } as MessageEvent);

    expect(received[0]?.type).toBe("message");
    stop();
    expect(listeners.size).toBe(0);
  });
});
