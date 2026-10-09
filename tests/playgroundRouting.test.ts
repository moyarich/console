import { describe, expect, it } from "vitest";
import {
  createMdxSection,
  type MdxPageModule,
} from "../apps/playground/src/utils/mdxSection";
import {
  buildPlaygroundPath,
  resolvePlaygroundPath,
} from "../apps/playground/src/utils/playgroundRouting";

const Page = () => null;

function module(
  label: string,
  tableOfContents: MdxPageModule["tableOfContents"] = [],
): MdxPageModule {
  return {
    default: Page,
    meta: { label },
    tableOfContents,
  };
}

const examples = createMdxSection({
  id: "examples",
  label: "Examples",
  modules: {
    "./70-extension-points/page.mdx": module("Extension points", [
      {
        value: "Introduction",
        depth: 2,
        id: "introduction",
      },
    ]),
    "./70-extension-points/02-process-output-processor/page.mdx": module(
      "processOutputProcessor",
    ),
    "./70-extension-points/05-output-renderer/01-structured/page.mdx":
      module("Structured output"),
  },
});

describe("playground hash routing", () => {
  it("opens a navigation group's first example", () => {
    expect(
      resolvePlaygroundPath("/examples/extension-points/output-renderer", [
        examples,
      ])?.page.id,
    ).toBe("extension-points/output-renderer/structured");
  });

  it("preserves moved output surface links and group links", () => {
    for (const path of [
      "/examples/addons/custom/output-surfaces",
      "/examples/addons/custom/output-surfaces/structured",
    ]) {
      expect(resolvePlaygroundPath(path, [examples])?.page.id).toBe(
        "extension-points/output-renderer/structured",
      );
    }
    expect(
      resolvePlaygroundPath("/examples/addons/custom/extension-points", [
        examples,
      ])?.page.id,
    ).toBe("extension-points");
    expect(
      resolvePlaygroundPath(
        "/examples/addons/custom/extension-points/consoleextensionpointsprocessoutputprocessor",
        [examples],
      )?.page.id,
    ).toBe("extension-points/process-output-processor");
  });
  it("preserves former extension-point overview links", () => {
    expect(
      resolvePlaygroundPath(
        "/examples/extension-points/process-output-processor/overview",
        [examples],
      )?.page.id,
    ).toBe("extension-points/process-output-processor");
  });
  it("builds shareable nested page routes", () => {
    expect(buildPlaygroundPath("examples", "extension-points")).toBe(
      "/examples/extension-points",
    );
  });

  it("resolves a nested page before treating the route tail as an outline", () => {
    const route = resolvePlaygroundPath("/examples/extension-points/overview", [
      examples,
    ]);

    expect(route?.page.id).toBe("extension-points");
    expect(route?.outline).toBeUndefined();
  });

  it("resolves an exported MDX heading as the final route segment", () => {
    const route = resolvePlaygroundPath(
      "/examples/extension-points/overview/introduction",
      [examples],
    );

    expect(route?.page.id).toBe("extension-points");
    expect(route?.outline?.value).toBe("Introduction");
  });

  it("rejects unknown page and heading routes", () => {
    expect(
      resolvePlaygroundPath("/examples/addons/missing", [examples]),
    ).toBeUndefined();

    expect(
      resolvePlaygroundPath("/examples/extension-points/overview/missing", [
        examples,
      ]),
    ).toBeUndefined();
  });
});
