import { fileURLToPath } from "node:url";
import { defineVSCodeDevConfig } from "@moyarich/vscode-dev-toolkit";

const config = defineVSCodeDevConfig({
  configFile: fileURLToPath(import.meta.url),
  projectDirectory: fileURLToPath(new URL("./", import.meta.url)),

  extension: {
    id: "moyarich.visualize-css-colors",
    developmentPath: "dist/vscode-extension",
    manifestFile: "extension.manifest.json",
    packageFile: "package.json",
    artifactDirectory: "artifacts",
    runtimeFiles: [
      "dist/extension.cjs",
      "README.md",
      "LICENSE",
      "CHANGELOG.md",
    ],
    source: {
      input: "dist/extension.cjs",
      module: "dist/extension-source.js",
      types: "dist/extension-source.d.ts",
    },
    dev: {
      fixtureFile: "demo/dev/fixtures/colors.css",
      settings: {
        "editor.colorDecorators": true,
        "telemetry.telemetryLevel": "off",
      },
      launchArgs: ["--disable-extension=vscode.css-language-features"],
    },
  },

  demo: {
    scenariosDirectory: "demo/scenarios",
    generatedScenariosDirectory: "demo/scenarios/generated",
    artifactsDirectory: "demo/artifacts",
    mediaDirectory: "media",
    defaultCodegenScenario: "color-mix",
    settings: {
      "workbench.colorTheme": "Default Dark Modern",
      "workbench.startupEditor": "none",
      "editor.colorDecorators": true,
      "editor.defaultColorDecorators": "never",
      "editor.minimap.enabled": false,
      "editor.fontSize": 18,
      "window.restoreWindows": "none",
      "workbench.editor.enablePreview": false,
      "telemetry.telemetryLevel": "off",
      "chat.disableAIFeatures": true,
    },
    launchArgs: [
      "--disable-extension=vscode.css-language-features",
      "--new-window",
      "--skip-welcome",
      "--skip-release-notes",
    ],
    extensionHostSetup: "demo/prepare-extension-host.mjs",

    async waitForReady({ page }) {
      await page.locator(".colorpicker-color-decoration").first().waitFor({
        state: "visible",
        timeout: 30_000,
      });
    },

    async prepareCodegenPage({ page }) {
      await page.evaluate(() => {
        const labelSwatches = () => {
          document
            .querySelectorAll(".monaco-editor .colorpicker-color-decoration")
            .forEach((element, index) => {
              const id = `color-swatch-${index}`;

              if (element.getAttribute("data-testid") !== id) {
                element.setAttribute("data-testid", id);
              }
            });
        };

        labelSwatches();

        const observer = new MutationObserver(labelSwatches);
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
        window.addEventListener("pagehide", () => observer.disconnect(), {
          once: true,
        });
      });
    },
  },
});

export default config;
