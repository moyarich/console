import { describe, expect, it } from "vitest";
import {
  createMdxSection,
  type MdxPageModule,
} from "../apps/playground/src/utils/mdxSection";

const Page = () => null;

function module(label: string): MdxPageModule {
  return {
    default: Page,
    meta: { label },
  };
}

describe("playground MDX sections", () => {
  it("supports a root page.mdx as the section overview and default page", () => {
    const section = createMdxSection({
      id: "docs",
      label: "Docs",
      modules: {
        "./page.mdx": module("Overview"),
        "./01-getting-started/page.mdx": module("Getting started"),
      },
    });

    expect(section.pages.map((page) => page.id)).toEqual([
      "overview",
      "getting-started",
    ]);
    expect(section.defaultPage?.id).toBe("overview");
    expect(section.getPage("overview")?.label).toBe("Overview");
  });

  it("places directory landing pages first inside their group without duplication", () => {
    const section = createMdxSection({
      id: "examples",
      label: "Examples",
      modules: {
        "./01-parser/01-basic/page.mdx": module("Basic"),
        "./01-parser/page.mdx": module("Overview"),
      },
    });
    expect(section.pages.map((page) => page.id)).toEqual([
      "parser",
      "parser/basic",
    ]);
    expect(section.defaultPage?.id).toBe("parser");
    expect(section.items).toHaveLength(1);
    const group = section.items[0];
    expect(group?.type).toBe("group");
    if (group?.type === "group") {
      expect(
        group.group.items.map((item) => item.type === "page" && item.page.id),
      ).toEqual(["parser", "parser/basic"]);
    }
  });

  it("accepts unnumbered directories and sorts them after explicitly ordered siblings", () => {
    const section = createMdxSection({
      id: "docs",
      label: "Docs",
      modules: {
        "./02-reference/page.mdx": module("Reference"),
        "./guides/page.mdx": module("Guides"),
        "./01-getting-started/page.mdx": module("Getting started"),
      },
    });

    expect(section.pages.map((page) => page.id)).toEqual([
      "getting-started",
      "reference",
      "guides",
    ]);
    expect(section.getPage("guides")?.label).toBe("Guides");
  });

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
