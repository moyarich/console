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
    "./01-addons/01-custom/01-extension-points/page.mdx": module(
      "Extension points",
      [
        {
          value: "consoleExtensionPoints.processOutputProcessor",
          depth: 2,
          id: "consoleextensionpointsprocessoutputprocessor",
        },
      ],
    ),
    "./01-addons/01-custom/02-other/page.mdx": module("Other"),
  },
});

describe("playground hash routing", () => {
  it("builds shareable nested page routes", () => {
    expect(
      buildPlaygroundPath("examples", "addons/custom/extension-points"),
    ).toBe("/examples/addons/custom/extension-points");
  });

  it("resolves a nested page before treating the route tail as an outline", () => {
    const route = resolvePlaygroundPath(
      "/examples/addons/custom/extension-points",
      [examples],
    );

    expect(route?.page.id).toBe("addons/custom/extension-points");
    expect(route?.outline).toBeUndefined();
  });

  it("resolves an exported MDX heading as the final route segment", () => {
    const route = resolvePlaygroundPath(
      "/examples/addons/custom/extension-points/consoleextensionpointsprocessoutputprocessor",
      [examples],
    );

    expect(route?.page.id).toBe("addons/custom/extension-points");
    expect(route?.outline?.value).toBe(
      "consoleExtensionPoints.processOutputProcessor",
    );
  });

  it("rejects unknown page and heading routes", () => {
    expect(
      resolvePlaygroundPath("/examples/addons/missing", [examples]),
    ).toBeUndefined();

    expect(
      resolvePlaygroundPath(
        "/examples/addons/custom/extension-points/missing",
        [examples],
      ),
    ).toBeUndefined();
  });
});
