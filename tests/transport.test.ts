import { describe, expect, it } from "vitest";
import {
  createConsoleEnvelope,
  createConsoleEventEmitter,
  isConsoleEnvelope,
  listenForConsoleWebSocket,
  serializeConsoleValue,
  type ConsoleEvent,
  type ConsoleWebSocketLike,
} from "@moyarich/console";

describe("console transport", () => {
  const event: ConsoleEvent = {
    type: "message",
    message: {
      method: "log",
      data: ["hello", { ok: true }],
      depth: 0,
    },
  };

  it("creates versioned envelopes", () => {
    const envelope = createConsoleEnvelope(event, "test");

    expect(isConsoleEnvelope(envelope)).toBe(true);
    expect(envelope.channel).toBe("test");
  });

  it("serializes values that JSON cannot represent directly", () => {
    const value = serializeConsoleValue({
      big: 10n,
      missing: undefined,
      fn() {},
    });

    expect(value).toEqual({
      big: "10n",
      missing: "[undefined]",
      fn: "[Function fn]",
    });
  });

  it("creates an envelope ready for window.postMessage", () => {
    const envelope = createConsoleEnvelope(event, "iframe");

    expect(isConsoleEnvelope(envelope)).toBe(true);
    expect(envelope.channel).toBe("iframe");
  });

  it("sends and receives WebSocket envelopes through an event emitter", () => {
    const listeners = new Set<(event: MessageEvent) => void>();
    const received: ConsoleEvent[] = [];
    const sent: string[] = [];
    const events = createConsoleEventEmitter();

    events.onEvent((value) => received.push(value));

    const socket: ConsoleWebSocketLike = {
      send(data) {
        sent.push(data);
      },
      addEventListener(_type, listener) {
        listeners.add(listener);
      },
      removeEventListener(_type, listener) {
        listeners.delete(listener);
      },
    };

    const stop = listenForConsoleWebSocket({
      socket,
      channel: "server",
      events,
    });

    socket.send(
      JSON.stringify(createConsoleEnvelope(event, "server")),
    );

    for (const listener of listeners) {
      listener({ data: sent[0] } as MessageEvent);
    }

    expect(received[0]?.type).toBe("message");

    stop();

    expect(listeners.size).toBe(0);
  });
});

describe("transport regression cases", () => {
  it.each([
    undefined,
    null,
    {},
    { method: "log", data: "hello", depth: 0 },
    { method: "unknown", data: [], depth: 0 },
    { method: "log", data: [], depth: -1 },
    { method: "log", data: [], depth: NaN },
    { method: "table", data: [], depth: 0, columns: "name" },
    { method: "log", data: [], depth: 0, source: {} },
  ])("rejects malformed messages: %j", (message) => {
    expect(
      isConsoleEnvelope({
        type: "CONSOLE_PANEL",
        version: 1,
        channel: "default",
        event: { type: "message", message },
      }),
    ).toBe(false);
  });

  it("preserves repeated references while stopping actual cycles", () => {
    const shared = { ok: true };
    const cyclic: Record<string, unknown> = {
      first: shared,
      second: shared,
    };

    cyclic.self = cyclic;

    expect(serializeConsoleValue(cyclic)).toEqual({
      first: { ok: true },
      second: { ok: true },
      self: "[Circular]",
    });
  });

  it("serializes invalid dates without throwing", () => {
    expect(serializeConsoleValue(new Date(NaN))).toBe("Invalid Date");
  });

  it("handles objects whose getters and string conversion throw", () => {
    const value = Object.create(null);

    Object.defineProperty(value, "broken", {
      enumerable: true,
      get() {
        throw new Error("broken");
      },
    });

    expect(serializeConsoleValue(value)).toBe("[Unserializable]");
  });
});
