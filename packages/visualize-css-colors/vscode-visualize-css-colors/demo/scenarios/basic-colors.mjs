import path from "node:path";
import { runScenarioModule } from "@moyarich/vscode-dev-toolkit/demo";
import config from "../../vscode-dev.config.mjs";

const scenario = {
  name: "basic-colors",
  title: "CSS color literals",
  description:
    "Hex, RGB, HSL, named colors, and alpha use the native color picker.",
  fileName: "colors.css",
  source:
    ":root {\n  --brand: #06c;\n  --alpha: rgba(34, 197, 94, 0.7);\n  --accent: hsl(265 60% 50% / 85%);\n  --named: rebeccapurple;\n}\n",

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
