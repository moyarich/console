import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesPath = fileURLToPath(
  new URL("../packages/console/src/styles.css", import.meta.url),
);
const consoleIndexPath = fileURLToPath(
  new URL("../packages/console/src/index.ts", import.meta.url),
);
const contextMenuThemeStylePath = fileURLToPath(
  new URL(
    "../packages/console/src/utils/console/style/getContextMenuThemeStyle.ts",
    import.meta.url,
  ),
);
const resizableAddonIndexPath = fileURLToPath(
  new URL("../packages/addons/resizable/src/index.tsx", import.meta.url),
);
const consolePackagePath = fileURLToPath(
  new URL("../packages/console/package.json", import.meta.url),
);
const resizableAddonPackagePath = fileURLToPath(
  new URL("../packages/addons/resizable/package.json", import.meta.url),
);

const styles = readFileSync(stylesPath, "utf8");
const consoleIndex = readFileSync(consoleIndexPath, "utf8");
const contextMenuThemeStyle = readFileSync(contextMenuThemeStylePath, "utf8");
const resizableAddonIndex = readFileSync(resizableAddonIndexPath, "utf8");
const consolePackage = JSON.parse(readFileSync(consolePackagePath, "utf8")) as {
  scripts: { build: string };
};
const resizableAddonPackage = JSON.parse(
  readFileSync(resizableAddonPackagePath, "utf8"),
) as {
  scripts: { build: string };
};

describe("console theme CSS", () => {
  it("loads each package stylesheet from its own entrypoint", () => {
    expect(consoleIndex).toContain('import "./styles.css";');
    expect(resizableAddonIndex).toContain('import "./styles.css";');
    expect(consolePackage.scripts.build).toContain("--inject-style");
    expect(resizableAddonPackage.scripts.build).toContain("--inject-style");
  });

  it("keeps public console custom properties as inputs", () => {
    const publicAssignments = styles.match(/^\s*--console-[\w-]+\s*:/gm);

    expect(publicAssignments).toBeNull();
  });

  it("preserves inherited color-scheme for portaled context menus", () => {
    expect(contextMenuThemeStyle).toContain(
      "themeStyle.colorScheme = computedStyle.colorScheme",
    );
  });

});
