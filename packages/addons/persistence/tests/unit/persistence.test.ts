import { describe, expect, it, vi } from "vitest";
import {
  createConsolePersistence,
  stringifyConsolePersistenceRecord,
} from "../../src";

describe("persistence pipeline", () => {
  it("writes records in sequence and serializes NDJSON", async () => {
    const batches: number[][] = [];
    const persistence = createConsolePersistence({
      adapters: [
        {
          write(records) {
            batches.push(records.map((record) => record.sequence));
          },
        },
      ],
      batchSize: 10,
      flushInterval: 0,
    });
    persistence.append({
      kind: "console",
      message: { method: "log", depth: 0, data: ["one"] },
    });
    persistence.append({
      kind: "terminal",
      entry: { stream: "stderr", data: "two" },
    });
    await persistence.flush();
    expect(batches).toEqual([[1, 2]]);
    expect(persistence.pending).toBe(0);
    const text = stringifyConsolePersistenceRecord({
      kind: "terminal",
      sequence: 3,
      capturedAt: "2026-10-28T00:00:00.000Z",
      entry: "hello",
    });
    expect(JSON.parse(text.trim()).entry).toBe("hello");
    await persistence.close();
  });

  it("retains failed batches for retry", async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const persistence = createConsolePersistence({
      adapters: [{ write }],
      batchSize: 10,
      flushInterval: 0,
    });
    persistence.append({ kind: "terminal", entry: "retry" });
    await expect(persistence.flush()).rejects.toThrow("offline");
    expect(persistence.pending).toBe(1);
    await persistence.flush();
    expect(write).toHaveBeenCalledTimes(2);
    expect(persistence.pending).toBe(0);
    await persistence.close();
  });

  it("rejects records when the bounded queue is full", async () => {
    const persistence = createConsolePersistence({
      adapters: [{ write() {} }],
      batchSize: 10,
      maxQueueSize: 10,
      flushInterval: 0,
    });
    for (let i = 0; i < 10; i++)
      persistence.append({ kind: "terminal", entry: String(i) });
    expect(() =>
      persistence.append({ kind: "terminal", entry: "overflow" }),
    ).toThrow("queue capacity");
    await persistence.close();
  });
});
