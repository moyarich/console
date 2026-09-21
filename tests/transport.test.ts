import { describe, expect, it } from "vitest";
import {
  CONSOLE_TRANSPORT_TYPE,
  CONSOLE_TRANSPORT_VERSION,
  createConsoleEventEmitter,
  isConsoleEnvelope,
  deserializeConsoleValue,
  listenForConsoleWebSocket,
  serializeConsoleEvent,
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

  it("validates a versioned transport envelope", () => {
    const envelope = {
      type: CONSOLE_TRANSPORT_TYPE,
      version: CONSOLE_TRANSPORT_VERSION,
      channel: "test",
      event: serializeConsoleEvent(event),
    };

    expect(isConsoleEnvelope(envelope)).toBe(true);
    expect(envelope.channel).toBe("test");
  });

  it("serializes values that JSON cannot represent directly", () => {
    const value = serializeConsoleValue({
      big: 10n,
      missing: undefined,
      fn() {},
    });

    expect(deserializeConsoleValue(value)).toMatchObject({
      big: 10n,
      missing: undefined,
    });
    expect((deserializeConsoleValue(value) as { fn: unknown }).fn).toEqual(
      expect.any(Function),
    );
  });

  it("sends and receives WebSocket envelopes through an event emitter", () => {
    const listeners = new Set<(event: MessageEvent) => void>();
    const received: ConsoleEvent[] = [];
    const sent: string[] = [];
    const events = createConsoleEventEmitter();

    events.on("message", (message) => {
      received.push({ type: "message", message });
    });
    events.on("clear", () => {
      received.push({ type: "clear" });
    });

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
      JSON.stringify({
        type: CONSOLE_TRANSPORT_TYPE,
        version: CONSOLE_TRANSPORT_VERSION,
        channel: "server",
        event: serializeConsoleEvent(event),
      }),
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

  it("preserves special values through serialization", () => {
    const value = {
      nan: NaN,
      infinity: Infinity,
      negativeInfinity: -Infinity,
      negativeZero: -0,
      date: new Date("2026-01-02T03:04:05.000Z"),
      regexp: /console/gi,
      map: new Map([["key", { ok: true }]]),
      set: new Set([1, 2]),
      typedArray: new Uint16Array([3, 4]),
    };

    const restored = deserializeConsoleValue(
      serializeConsoleValue(value),
    ) as typeof value;

    expect(Number.isNaN(restored.nan)).toBe(true);
    expect(restored.infinity).toBe(Infinity);
    expect(restored.negativeInfinity).toBe(-Infinity);
    expect(Object.is(restored.negativeZero, -0)).toBe(true);
    expect(restored.date).toEqual(value.date);
    expect(restored.regexp).toEqual(value.regexp);
    expect(restored.map).toEqual(value.map);
    expect(restored.set).toEqual(value.set);
    expect(restored.typedArray).toEqual(value.typedArray);
  });

  it("serializes invalid dates without throwing", () => {
    const restored = deserializeConsoleValue(
      serializeConsoleValue(new Date(NaN)),
    );

    expect(restored).toBeInstanceOf(Date);
    expect(Number.isNaN((restored as Date).getTime())).toBe(true);
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
