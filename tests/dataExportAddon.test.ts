import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleAddonManager,
  resolveConsoleProcessOutputEntries,
  type ConsoleDataService,
  type ConsoleDataSnapshot,
  type ConsoleMessageData,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";
import {
  CONSOLE_DATA_EXPORT_ADDON_ID,
  CONSOLE_DATA_EXPORT_TYPE,
  CONSOLE_DATA_EXPORT_VERSION,
  createConsoleDataExportAddon,
  createConsoleDataExportEnvelope,
  createConsoleDataExportService,
  formatConsoleDataExportJson,
  formatConsoleDataExportText,
} from "@moyarich/console-addon-data-export";

function createDataService(snapshot: ConsoleDataSnapshot): ConsoleDataService {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => ({ dispose: () => undefined }),
  };
}

describe("@moyarich/console-addon-data-export", () => {
  it("uses the package-qualified addon id", () => {
    expect(createConsoleDataExportAddon().id).toBe(
      CONSOLE_DATA_EXPORT_ADDON_ID,
    );
    expect(CONSOLE_DATA_EXPORT_ADDON_ID).toBe(
      "@moyarich/console-addon-data-export",
    );
  });

  it("formats retained and visible structured output independently", () => {
    const visible: ConsoleMessageData = {
      id: "visible",
      method: "log",
      depth: 0,
      data: ["visible", { ok: true }],
    };
    const hidden: ConsoleMessageData = {
      id: "hidden",
      method: "warn",
      depth: 0,
      data: ["hidden"],
    };
    const snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [visible, hidden],
      visible: [visible],
    };

    expect(formatConsoleDataExportText(snapshot, "visible")).toContain(
      "visible",
    );
    expect(formatConsoleDataExportText(snapshot, "visible")).not.toContain(
      "hidden",
    );
    expect(formatConsoleDataExportText(snapshot, "all")).toContain(
      "[warn] hidden",
    );
  });

  it("serializes rich and circular structured values safely", () => {
    const circular: Record<string, unknown> = { name: "cycle" };
    circular.self = circular;

    const snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [
        {
          method: "log",
          depth: 0,
          data: [circular, BigInt(42), undefined, NaN],
        },
      ],
      visible: [
        {
          method: "log",
          depth: 0,
          data: [circular, BigInt(42), undefined, NaN],
        },
      ],
    };

    const envelope = createConsoleDataExportEnvelope(snapshot, "all");
    const json = formatConsoleDataExportJson(snapshot, "all");

    expect(envelope.type).toBe(CONSOLE_DATA_EXPORT_TYPE);
    expect(envelope.version).toBe(CONSOLE_DATA_EXPORT_VERSION);
    expect(envelope.scope).toBe("all");
    expect(envelope.count).toBe(1);
    expect(envelope.records[0]).toMatchObject({
      kind: "console",
      method: "log",
      depth: 0,
    });
    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain('"text"');
    expect(json).toContain('"data"');
    expect(json).toContain("[Circular]");
    expect(json).toContain('"bigint"');
    expect(json).toContain('"nan"');
  });

  it("exports the resolved ANSI view without styling or stale CR progress", () => {
    const escape = String.fromCharCode(27);
    const processor: ConsoleProcessOutputProcessor = {
      id: "test-progress-transform",
      process({ output }) {
        if (!output.data.includes("20%")) return;

        return {
          data: output.data.replace("20%", "complete"),
          metadata: { transformed: true },
        };
      },
    };
    const rawEntries = [
      `${escape}[31mDownloading 10%${escape}[0m\r`,
      `${escape}[32mDownloading 20%${escape}[0m\n`,
    ];
    const resolved = resolveConsoleProcessOutputEntries(rawEntries, [
      processor,
    ]);
    const snapshot: ConsoleDataSnapshot = {
      mode: "ansi",
      rawEntries,
      all: resolved,
      visible: resolved,
    };

    const text = formatConsoleDataExportText(snapshot);
    const json = formatConsoleDataExportJson(snapshot);

    expect(resolved).toHaveLength(1);
    expect(text).toBe("Downloading complete");
    expect(text).not.toContain(escape);
    expect(json).toContain('"kind": "process"');
    expect(json).toContain('"text": "Downloading complete"');
    expect(json).toContain('"transformed": true');
    expect(json).not.toContain("Downloading 10%");
  });

  it("includes useful message text, data, time, source, and console options", () => {
    const snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [
        {
          id: "table-1",
          method: "table",
          depth: 1,
          data: ["Users", [{ id: 1, name: "Ada" }]],
          timestamp: Date.UTC(2026, 8, 23, 4, 0, 0),
          source: "worker:preview",
          columns: ["id", "name"],
        },
      ],
      visible: [],
    };

    const envelope = createConsoleDataExportEnvelope(snapshot, "all");

    expect(envelope.records[0]).toEqual({
      kind: "console",
      id: "table-1",
      method: "table",
      text: expect.stringContaining("Users"),
      data: ["Users", [{ id: 1, name: "Ada" }]],
      depth: 1,
      timestamp: Date.UTC(2026, 8, 23, 4, 0, 0),
      time: "2026-09-23T04:00:00.000Z",
      source: "worker:preview",
      options: {
        columns: ["id", "name"],
      },
    });
  });

  it("provides a headless service over the core data contract", () => {
    const snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [
        { method: "log", depth: 0, data: ["all"] },
        { method: "error", depth: 0, data: ["hidden"] },
      ],
      visible: [{ method: "log", depth: 0, data: ["all"] }],
    };
    const service = createConsoleDataExportService(createDataService(snapshot));

    expect(service.toText()).toBe("all");
    expect(service.toText("all")).toContain("[error] hidden");
    expect(JSON.parse(service.toJson()).scope).toBe("visible");
  });

  it("contributes richer export actions without duplicating core Copy output", () => {
    const manager = createConsoleAddonManager();
    const snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [{ method: "log", depth: 0, data: ["message"] }],
      visible: [{ method: "log", depth: 0, data: ["message"] }],
    };

    manager.services.provide(consoleServices.data, createDataService(snapshot));
    manager.load(createConsoleDataExportAddon());

    const panelActions = manager.extensions.getAll(
      consoleExtensionPoints.panelAction,
    );
    const contextActions = manager.extensions.getAll(
      consoleExtensionPoints.contextMenuAction,
    );

    expect(panelActions.map((action) => action.label)).toEqual([
      "Copy as JSON",
      "Download text",
      "Download JSON",
    ]);
    expect(panelActions.map((action) => action.label)).not.toContain(
      "Copy output",
    );
    expect(contextActions.map((action) => action.label)).toEqual([
      "Copy as JSON",
    ]);

    expect(manager.unload(CONSOLE_DATA_EXPORT_ADDON_ID)).toBe(true);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.panelAction),
    ).toEqual([]);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.contextMenuAction),
    ).toEqual([]);
  });

  it("requires the generic core data service", () => {
    const manager = createConsoleAddonManager();

    expect(() => manager.load(createConsoleDataExportAddon())).toThrow(
      /console\.data.*not available/,
    );
    expect(manager.has(CONSOLE_DATA_EXPORT_ADDON_ID)).toBe(false);
  });
});
