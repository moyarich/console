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

describe("transport regression cases", () => {
  it.each([
    undefined, null, {},
    { method: "log", data: "hello", depth: 0 },
    { method: "unknown", data: [], depth: 0 },
    { method: "log", data: [], depth: -1 },
    { method: "log", data: [], depth: NaN },
    { method: "table", data: [], depth: 0, columns: "name" },
    { method: "log", data: [], depth: 0, source: {} },
  ])("rejects malformed messages: %j", (message) => {
    expect(isConsoleEnvelope({
      type: "@moyarich/console", version: 1, channel: "default",
      event: { type: "message", message },
    })).toBe(false);
  });

  it("preserves repeated references while stopping actual cycles", () => {
    const shared = { ok: true };
    const cyclic: Record<string, unknown> = { first: shared, second: shared };
    cyclic.self = cyclic;
    expect(serializeConsoleValue(cyclic)).toEqual({
      first: { ok: true }, second: { ok: true }, self: "[Circular]",
    });
  });

  it("serializes invalid dates without throwing", () => {
    expect(serializeConsoleValue(new Date(NaN))).toBe("Invalid Date");
  });

  it("handles objects whose getters and string conversion throw", () => {
    const value = Object.create(null);
    Object.defineProperty(value, "broken", { enumerable: true, get() { throw new Error("broken"); } });
    expect(serializeConsoleValue(value)).toBe("[Unserializable]");
  });
});
