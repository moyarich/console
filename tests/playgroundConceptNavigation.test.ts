import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { createPackageSections } from "../apps/playground/src/playground-registry/createPackageSections";
import { resolvePlaygroundPath } from "../apps/playground/src/utils/playgroundRouting";

it("keeps the console theming guide and its examples in the same topic", () => {
  const base = new URL("../packages/console/examples/", import.meta.url);
  const modules = Object.fromEntries(
    readdirSync(base, { recursive: true, encoding: "utf8" })
      .filter((path) => path.endsWith("page.mdx"))
      .map((path) => [
        `./console/examples/${path}`,
        { default: () => null, meta: { label: "Page" } },
      ]),
  );
  const [section] = createPackageSections(modules, {
    "./console/package.json": { name: "@moyarich/console" },
  });
  expect(
    section!.pages
      .filter(({ id }) => id.startsWith("usage/theming"))
      .map(({ id }) => id),
  ).toEqual([
    "usage/theming",
    "usage/theming/color-scheme",
    "usage/theming/custom-tokens",
  ]);
  expect(section!.pages.some(({ id }) => id.startsWith("docs/"))).toBe(false);
  expect(
    readFileSync(new URL("90-usage/11-theming/page.mdx", base), "utf8"),
  ).toContain("Theme-token naming contract");
});

it("groups component-prop examples with their corresponding extension points", () => {
  const base = new URL("../packages/console/examples/", import.meta.url);
  const modules = Object.fromEntries(
    readdirSync(base, { recursive: true, encoding: "utf8" })
      .filter((path) => path.endsWith("page.mdx"))
      .map((path) => {
        return [
          `./console/examples/${path}`,
          { default: () => null, meta: { label: "Page" } },
        ];
      }),
  );
  const sections = createPackageSections(modules, {
    "./console/package.json": { name: "@moyarich/console" },
  });
  const moved = [
    ["custom-renderers/value-renderer", "value-renderer/component-prop"],
    ["custom-renderers/message-renderer", "message-renderer/component-prop"],
    [
      "extensible-actions/context-menu-actions",
      "context-menu-action/component-prop",
    ],
    ["extensible-actions/message-actions", "message-action/component-prop"],
    ["link-providers/structured", "link-provider/component-prop"],
    ["link-providers/ansi", "link-provider/component-prop"],
  ];
  for (const [former, current] of moved) {
    const route = resolvePlaygroundPath(
      `/package-console/extension-points/${current}`,
      sections,
    );
    expect(route?.page.id).toBe(`extension-points/${current}`);
    expect(
      resolvePlaygroundPath(
        `/package-console/usage/customization/${former}`,
        sections,
      ),
    ).toBeUndefined();
  }
  for (const [former, current] of [
    ["usage/typescript-compile", "events/react-hooks/typescript-compile"],
    [
      "usage/console-enhancements",
      "events/react-hooks/message-state/deduplication-and-reset",
    ],
    ["usage/customization/theming", "usage/theming"],
    ["usage/customization/theming/color-scheme", "usage/theming/color-scheme"],
    [
      "usage/customization/theming/custom-tokens",
      "usage/theming/custom-tokens",
    ],
  ]) {
    expect(
      resolvePlaygroundPath(`/package-console/${current}`, sections)?.page.id,
    ).toBe(current);
    expect(
      resolvePlaygroundPath(`/package-console/${former}`, sections),
    ).toBeUndefined();
    expect(
      resolvePlaygroundPath(`/package-console/examples/${former}`, sections),
    ).toBeUndefined();
  }

  expect(
    sections[0]!.pages.some(({ id }) =>
      /^usage\/customization\/(custom-renderers|extensible-actions|link-providers)/.test(
        id,
      ),
    ),
  ).toBe(false);
});
