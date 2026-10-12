import { describe, expect, it } from "vitest";
import {
  createConsoleSession,
  parseConsoleSession,
  stringifyConsoleSession,
  CONSOLE_SESSION_VERSION,
} from "@moyarich/console-addon-session";

describe("Console session snapshots", () => {
  it("round-trips structured messages and retention metadata", () => {
    const original = createConsoleSession({
      mode: "console",
      messages: [
        {
          id: "one",
          method: "log",
          depth: 0,
          data: [42, "hello", new Date("2020-01-01T00:00:00.000Z")],
        },
      ],
      droppedCount: 12,
    });
    const restored = parseConsoleSession(stringifyConsoleSession(original));
    expect(restored.mode).toBe("console");
    expect(restored.droppedCount).toBe(12);
    expect(restored.version).toBe(CONSOLE_SESSION_VERSION);
    if (restored.mode === "console") {
      expect(restored.messages[0]?.data[0]).toBe(42);
      expect(restored.messages[0]?.data[2]).toEqual(
        new Date("2020-01-01T00:00:00.000Z"),
      );
    }
  });
  it("round-trips terminal entries in source order", () => {
    const session = createConsoleSession({
      mode: "terminal",
      entries: ["connected", { id: "done", data: "done", stream: "stdout" }],
    });
    const restored = parseConsoleSession(stringifyConsoleSession(session));
    expect(restored.mode).toBe("terminal");
    if (restored.mode === "terminal")
      expect(restored.entries).toEqual([
        "connected",
        { id: "done", data: "done", stream: "stdout" },
      ]);
  });
  it("round-trips rich terminal metadata without JSON serialization errors", () => {
    const circular: Record<string, unknown> = {
      timestamp: new Date("2024-02-03T00:00:00.000Z"),
      count: 9n,
    };
    circular.self = circular;
    const session = createConsoleSession({
      mode: "terminal",
      entries: [{ id: "event", data: "ready", metadata: circular }],
    });
    const restored = parseConsoleSession(stringifyConsoleSession(session));
    expect(restored.mode).toBe("terminal");
    if (restored.mode === "terminal") {
      const entry = restored.entries[0];
      expect(typeof entry).toBe("object");
      if (typeof entry !== "string" && entry) {
        expect(entry.metadata?.timestamp).toEqual(
          new Date("2024-02-03T00:00:00.000Z"),
        );
        expect(entry.metadata?.count).toBe(9n);
        expect(entry.metadata?.self).toBe("[Circular]");
      }
    }
  });

  it("rejects malformed terminal metadata", () => {
    const base = {
      type: "MOYARICH_CONSOLE_SESSION",
      version: 1,
      droppedCount: 0,
      mode: "terminal",
    };
    expect(() =>
      parseConsoleSession({
        ...base,
        entries: [{ data: "line", metadata: 42 }],
      }),
    ).toThrow(/Invalid terminal entries/);
  });

  it("rejects unknown future versions", () => {
    const saved = createConsoleSession({ mode: "console", messages: [] });
    expect(() => parseConsoleSession({ ...saved, version: 999 })).toThrow(
      /Unsupported/,
    );
  });
  it("rejects invalid structured depths and terminal metadata", () => {
    const base = {
      type: "MOYARICH_CONSOLE_SESSION",
      version: 1,
      droppedCount: 0,
    };
    for (const depth of [-1, 1.5, Number.POSITIVE_INFINITY]) {
      expect(() =>
        parseConsoleSession({
          ...base,
          mode: "console",
          messages: [{ method: "log", data: [], depth }],
        }),
      ).toThrow(/Invalid console message/);
    }
    for (const entry of [
      { data: "hello", id: 42 },
      { data: "hello", stream: "unknown" },
    ]) {
      expect(() =>
        parseConsoleSession({
          ...base,
          mode: "terminal",
          entries: [entry],
        }),
      ).toThrow(/Invalid terminal entries/);
    }
  });
  it("rejects malformed input and retention counters", () => {
    expect(() => parseConsoleSession("{}")).toThrow();
    expect(() =>
      createConsoleSession({ mode: "console", messages: [], droppedCount: -2 }),
    ).toThrow();
    expect(() =>
      parseConsoleSession({
        type: "MOYARICH_CONSOLE_SESSION",
        version: 1,
        mode: "console",
        droppedCount: 0,
        messages: null,
      }),
    ).toThrow();
  });
});
