import { describe, expect, it } from "vitest";
import {
  createMdxSection,
  type MdxPageModule,
} from "../packages/playground/src/utils/mdxSection";

const Page = () => null;

function module(label: string): MdxPageModule {
  return {
    default: Page,
    meta: { label },
  };
}

describe("playground MDX sections", () => {
  it("builds ordered page IDs through arbitrarily nested groups", () => {
    const section = createMdxSection({
      id: "api",
      label: "API",
      modules: {
        "./01-overview/page.mdx": module("Overview"),
        "./02-addons/01-overview/page.mdx": module("Addon overview"),
        "./02-addons/02-first-party/01-data-export/page.mdx":
          module("Data export"),
        "./02-addons/02-first-party/02-diagnostics/page.mdx":
          module("Diagnostics"),
      },
    });

    expect(section.pages.map((page) => page.id)).toEqual([
      "overview",
      "addons/overview",
      "addons/first-party/data-export",
      "addons/first-party/diagnostics",
    ]);

    expect(section.getPage("addons/first-party/data-export")?.label).toBe(
      "Data export",
    );

    const addons = section.items[1];

    expect(addons?.type).toBe("group");

    if (addons?.type !== "group") {
      return;
    }

    expect(addons.group.label).toBe("Addons");
    expect(addons.group.items[1]?.type).toBe("group");
  });
});
