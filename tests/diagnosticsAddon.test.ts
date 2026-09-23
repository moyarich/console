import { describe, expect, it } from "vitest";
import {
  consoleExtensionPoints,
  consoleServices,
  createConsoleAddonManager,
  resolveConsoleProcessOutputEntries,
  type ConsoleDataService,
  type ConsoleDataSnapshot,
  type ConsoleProcessOutputProcessor,
} from "@moyarich/console";
import {
  CONSOLE_DIAGNOSTICS_ADDON_ID,
  CONSOLE_DIAGNOSTICS_TYPE,
  CONSOLE_DIAGNOSTICS_VERSION,
  createConsoleDiagnosticsAddon,
  createConsoleDiagnosticsReport,
  createConsoleDiagnosticsService,
  formatConsoleDiagnosticsJson,
} from "@moyarich/console-addon-diagnostics";

function createDataService(snapshot: ConsoleDataSnapshot): ConsoleDataService {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => ({ dispose: () => undefined }),
  };
}

describe("@moyarich/console-addon-diagnostics", () => {
  it("uses the package-qualified addon id", () => {
    expect(createConsoleDiagnosticsAddon().id).toBe(
      CONSOLE_DIAGNOSTICS_ADDON_ID,
    );
    expect(CONSOLE_DIAGNOSTICS_ADDON_ID).toBe(
      "@moyarich/console-addon-diagnostics",
    );
  });

  it("captures retained and visible structured messages safely", () => {
    const circular: Record<string, unknown> = { name: "cycle" };
    circular.self = circular;

    const snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [
        {
          id: "visible",
          method: "log",
          depth: 0,
          data: ["request", circular, BigInt(42)],
          source: "preview",
        },
        {
          id: "hidden",
          method: "warn",
          depth: 0,
          data: ["hidden"],
        },
      ],
      visible: [
        {
          id: "visible",
          method: "log",
          depth: 0,
          data: ["request", circular, BigInt(42)],
          source: "preview",
        },
      ],
    };

    const report = createConsoleDiagnosticsReport(snapshot);
    const json = formatConsoleDiagnosticsJson(snapshot);

    expect(report.type).toBe(CONSOLE_DIAGNOSTICS_TYPE);
    expect(report.version).toBe(CONSOLE_DIAGNOSTICS_VERSION);
    expect(report.mode).toBe("console");
    expect(report.counts).toEqual({ all: 2, visible: 1 });
    expect(json).toContain("[Circular]");
    expect(json).toContain('"bigint"');
    expect(json).toContain('"source": "preview"');
  });

  it("keeps raw ANSI chunks distinct from normalized and processed output", () => {
    const processor: ConsoleProcessOutputProcessor = {
      id: "diagnostics-transform",
      process(output) {
        if (!output.data.includes("20%")) return;

        return {
          data: output.data.replace("20%", "complete"),
          metadata: { transformed: true },
        };
      },
    };
    const rawEntries = ["Progress 10%\r", "Progress 20%\n"];
    const resolved = resolveConsoleProcessOutputEntries(rawEntries, [
      processor,
    ]);
    const snapshot: ConsoleDataSnapshot = {
      mode: "ansi",
      rawEntries,
      all: resolved,
      visible: resolved,
    };

    const report = createConsoleDiagnosticsReport(snapshot);

    expect(report.mode).toBe("ansi");
    if (report.mode !== "ansi") throw new Error("Expected ANSI report.");

    expect(report.counts).toEqual({ raw: 2, all: 1, visible: 1 });
    expect(report.rawEntries).toEqual([
      { kind: "string", data: "Progress 10%\r" },
      { kind: "string", data: "Progress 20%\n" },
    ]);
    expect(report.all[0]).toMatchObject({
      kind: "process",
      normalizedData: "Progress 20%",
      resolvedData: "Progress complete",
      metadata: { transformed: true },
    });
  });

  it("provides a live headless diagnostics service", () => {
    let snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [{ method: "log", depth: 0, data: ["first"] }],
      visible: [{ method: "log", depth: 0, data: ["first"] }],
    };
    const data: ConsoleDataService = {
      getSnapshot: () => snapshot,
      subscribe: () => ({ dispose: () => undefined }),
    };
    const service = createConsoleDiagnosticsService(data);

    expect(service.getReport().counts.all).toBe(1);

    snapshot = {
      mode: "console",
      all: [
        { method: "log", depth: 0, data: ["first"] },
        { method: "error", depth: 0, data: ["second"] },
      ],
      visible: [{ method: "error", depth: 0, data: ["second"] }],
    };

    expect(service.getReport().counts).toEqual({ all: 2, visible: 1 });
  });

  it("contributes diagnostics actions and cleans them up on unload", () => {
    const manager = createConsoleAddonManager();
    const snapshot: ConsoleDataSnapshot = {
      mode: "console",
      all: [{ method: "log", depth: 0, data: ["message"] }],
      visible: [{ method: "log", depth: 0, data: ["message"] }],
    };

    manager.services.provide(consoleServices.data, createDataService(snapshot));
    manager.load(createConsoleDiagnosticsAddon());

    expect(
      manager.extensions
        .getAll(consoleExtensionPoints.panelAction)
        .map((action) => action.label),
    ).toEqual(["Copy diagnostics JSON", "Download diagnostics JSON"]);
    expect(
      manager.extensions
        .getAll(consoleExtensionPoints.contextMenuAction)
        .map((action) => action.label),
    ).toEqual(["Copy diagnostics JSON"]);

    expect(manager.unload(CONSOLE_DIAGNOSTICS_ADDON_ID)).toBe(true);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.panelAction),
    ).toEqual([]);
    expect(
      manager.extensions.getAll(consoleExtensionPoints.contextMenuAction),
    ).toEqual([]);
  });

  it("requires the generic core data service", () => {
    const manager = createConsoleAddonManager();

    expect(() => manager.load(createConsoleDiagnosticsAddon())).toThrow(
      /console\.data.*not available/,
    );
    expect(manager.has(CONSOLE_DIAGNOSTICS_ADDON_ID)).toBe(false);
  });
});
