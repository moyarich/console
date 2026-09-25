import path from "node:path";
import { runScenarioModule } from "@moyarich/vscode-dev-toolkit/demo";
import config from "../../vscode-dev.config.mjs";

const scenario = {
  name: "relative-colors",
  title: "Relative colors and modern spaces",
  description:
    "Relative channels, calc(), OKLCH, and Display P3 resolve to sRGB swatches.",
  fileName: "relative.css",
  source:
    ":root {\n  --relative: hsl(from red calc(h + 120) s l);\n  --alpha: oklab(from green l a b / 0.5);\n  --oklch: oklch(60% 0.15 250);\n  --p3: color(display-p3 0.9 0.2 0.4);\n}\n",

  async run({
    page,
    name,
    outputDirectory,
    pause,
    showDemoCaption,
    hideDemoCaption,
    installDemoMagnifierCursorOverlay,
    pointDemoMagnifierCursorAt,
    removeDemoMagnifierCursorOverlay,
  }) {
    const swatch = page.locator(".colorpicker-color-decoration").first();

    await showDemoCaption({
      page,
      caption: {
        title: scenario.title,
        description: scenario.description,
        placement: "top-right",
      },
    });
    await pause(2500);
    await hideDemoCaption({ page });

    await installDemoMagnifierCursorOverlay({ page });
    await pointDemoMagnifierCursorAt({ page, locator: swatch });
    await swatch.hover();

    await page
      .locator(".colorpicker-widget")
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
    await page
      .locator("demo-magnifier-cursor-overlay .cursor.visible")
      .waitFor({ state: "visible" });

    await pause(500);
    await page.screenshot({
      path: path.join(outputDirectory, `${name}-magnifier.png`),
    });

    await pause(2200);
    await page.keyboard.press("Escape");
    await removeDemoMagnifierCursorOverlay({ page });
    await pause(1000);

    await page.screenshot({
      path: path.join(outputDirectory, `${name}.png`),
    });
  },
};

export default scenario;

await runScenarioModule({
  config,
  moduleUrl: import.meta.url,
  name: scenario.name,
  scenario,
});
