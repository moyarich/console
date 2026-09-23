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
  CONSOLE_EXPORT_ADDON_ID,
  CONSOLE_EXPORT_TYPE,
  CONSOLE_EXPORT_VERSION,
  createConsoleExportAddon,
  createConsoleExportEnvelope,
  createConsoleExportService,
  formatConsoleExportJson,
  formatConsoleExportText,
} from "@moyarich/console-addon-export";

function createDataService(snapshot: ConsoleDataSnapshot): ConsoleDataService {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => ({ dispose: () => undefined }),
  };
}

describe("@moyarich/console-addon-export", () => {
  it("uses the package-qualified addon id", () => {
    expect(createConsoleExportAddon().id).toBe(CONSOLE_EXPORT_ADDON_ID);
    expect(CONSOLE_EXPORT_ADDON_ID).toBe("@moyarich/console-addon-export");
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

    expect(formatConsoleExportText(snapshot, "visible")).toContain("visible");
    expect(formatConsoleExportText(snapshot, "visible")).not.toContain(
      "hidden",
    );
    expect(formatConsoleExportText(snapshot, "all")).toContain("[warn] hidden");
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

    const envelope = createConsoleExportEnvelope(snapshot, "all");
    const json = formatConsoleExportJson(snapshot, "all");

    expect(envelope.type).toBe(CONSOLE_EXPORT_TYPE);
    expect(envelope.version).toBe(CONSOLE_EXPORT_VERSION);
    expect(envelope.scope).toBe("all");
    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("[Circular]");
    expect(json).toContain('"bigint"');
    expect(json).toContain('"nan"');
  });

  it("exports the resolved ANSI view without styling or stale CR progress", () => {
    const escape = String.fromCharCode(27);
    const processor: ConsoleProcessOutputProcessor = {
      id: "test-progress-transform",
      process(output) {
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
    const resolved = resolveConsoleProcessOutputEntries(rawEntries, [processor]);
    const snapshot: ConsoleDataSnapshot = {
      mode: "ansi",
      rawEntries,
      all: resolved,
      visible: resolved,
    };

    const text = formatConsoleExportText(snapshot);
    const json = formatConsoleExportJson(snapshot);

    expect(resolved).toHaveLength(1);
    expect(text).toBe("Downloading complete");
    expect(text).not.toContain(escape);
    expect(json).toContain('"transformed": true');
    expect(json).not.toContain("Downloading 10%");
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
    const service = createConsoleExportService(createDataService(snapshot));

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
    manager.load(createConsoleExportAddon());

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
    expect(contextActions.map((action) => action.label)).toEqual(["Copy as JSON"]);

    expect(manager.unload(CONSOLE_EXPORT_ADDON_ID)).toBe(true);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.panelAction),
    ).toEqual([]);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.contextMenuAction),
    ).toEqual([]);
  });

  it("requires the generic core data service", () => {
    const manager = createConsoleAddonManager();

    expect(() => manager.load(createConsoleExportAddon())).toThrow(
      /console\.data.*not available/,
    );
    expect(manager.has(CONSOLE_EXPORT_ADDON_ID)).toBe(false);
  });
});
