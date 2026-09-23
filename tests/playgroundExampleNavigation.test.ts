import { describe, expect, it } from "vitest";
import { buildExampleNavigation } from "../apps/playground/src/components/ExampleSidebar/exampleNavigation";

const groups = [
  {
    id: "console-methods",
    label: "Console methods",
    order: 5,
    directory: "05-console-methods",
  },
  {
    id: "ansi",
    label: "Ansi",
    order: 10,
    directory: "10-ansi",
  },
] as const;

const examples = [
  {
    id: "console-log",
    groupId: "console-methods",
    groupOrder: 5,
    order: 1,
    label: "console.log",
    description: "Render structured log values.",
  },
  {
    id: "terminal",
    groupId: "ansi",
    groupOrder: 10,
    order: 1,
    label: "Terminal output",
    description: "Render ANSI process output.",
  },
] as const;

describe("buildExampleNavigation", () => {
  it("keeps generated group ordering and groups matching examples", () => {
    const navigation = buildExampleNavigation(examples, groups, "");

    expect(navigation.map(({ group }) => group.id)).toEqual([
      "console-methods",
      "ansi",
    ]);
    expect(navigation[0]?.examples.map((example) => example.id)).toEqual([
      "console-log",
    ]);
  });

  it("searches example labels, descriptions, ids, and group labels", () => {
    expect(
      buildExampleNavigation(examples, groups, "structured")[0]?.examples[0]
        ?.id,
    ).toBe("console-log");

    expect(
      buildExampleNavigation(examples, groups, "ansi")[0]?.examples[0]?.id,
    ).toBe("terminal");

    expect(buildExampleNavigation(examples, groups, "missing")).toEqual([]);
  });
});
