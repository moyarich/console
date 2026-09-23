import { describe, expect, it } from "vitest";
import {
  consoleCapabilities as hostCapabilities,
  consoleExtensionPoints as hostExtensionPoints,
  consoleServices as hostServices,
} from "@moyarich/console";
import {
  consoleCapabilities as coreCapabilities,
  consoleExtensionPoints as coreExtensionPoints,
  consoleServices as coreServices,
} from "@moyarich/console-core";

describe("console core host interop", () => {
  it("re-exports the same addon SDK token singletons from the React host", () => {
    expect(hostCapabilities).toBe(coreCapabilities);
    expect(hostServices).toBe(coreServices);
    expect(hostExtensionPoints).toBe(coreExtensionPoints);

    expect(hostServices.data).toBe(coreServices.data);
    expect(hostServices.viewport).toBe(coreServices.viewport);
    expect(hostExtensionPoints.panelAction).toBe(
      coreExtensionPoints.panelAction,
    );
    expect(hostExtensionPoints.processOutputProcessor).toBe(
      coreExtensionPoints.processOutputProcessor,
    );
  });
});
