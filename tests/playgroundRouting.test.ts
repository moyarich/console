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
  id: "package-console",
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
      resolvePlaygroundPath(
        "/package-console/extension-points/output-renderer",
        [examples],
      )?.page.id,
    ).toBe("extension-points/output-renderer/structured");
  });

  it("rejects former route aliases", () => {
    for (const path of [
      "/examples/extension-points",
      "/package-console/addons/custom/output-surfaces",
      "/package-console/extension-points/process-output-processor/overview",
      "/package-console/docs/extension-points",
    ]) {
      expect(resolvePlaygroundPath(path, [examples])).toBeUndefined();
    }
  });
  it("builds shareable nested page routes", () => {
    expect(buildPlaygroundPath("package-console", "extension-points")).toBe(
      "/package-console/extension-points",
    );
  });

  it("resolves a nested page before treating the route tail as an outline", () => {
    const route = resolvePlaygroundPath(
      "/package-console/extension-points/process-output-processor",
      [examples],
    );

    expect(route?.page.id).toBe("extension-points/process-output-processor");
    expect(route?.outline).toBeUndefined();
  });

  it("resolves an exported MDX heading as the final route segment", () => {
    const route = resolvePlaygroundPath(
      "/package-console/extension-points/introduction",
      [examples],
    );

    expect(route?.page.id).toBe("extension-points");
    expect(route?.outline?.value).toBe("Introduction");
  });

  it("rejects unknown page and heading routes", () => {
    expect(
      resolvePlaygroundPath("/package-console/addons/missing", [examples]),
    ).toBeUndefined();

    expect(
      resolvePlaygroundPath("/package-console/extension-points/missing", [
        examples,
      ]),
    ).toBeUndefined();
  });
});
