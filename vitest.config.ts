import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@moyarich/console-addon-animation": fileURLToPath(
        new URL("./packages/addons/animation/src/index.tsx", import.meta.url),
      ),
      "@moyarich/console-addon-navigation": fileURLToPath(
        new URL("./packages/addons/navigation/src/index.ts", import.meta.url),
      ),
      "@moyarich/console-addon-selection": fileURLToPath(
        new URL("./packages/addons/selection/src/index.tsx", import.meta.url),
      ),
      "@moyarich/console-addon-annotations": fileURLToPath(
        new URL("./packages/addons/annotations/src/index.tsx", import.meta.url),
      ),
      "@src": fileURLToPath(new URL("./apps/playground/src", import.meta.url)),
      "@moyarich/console-core": fileURLToPath(
        new URL("./packages/console-core/src/index.ts", import.meta.url),
      ),
      "@moyarich/console": fileURLToPath(
        new URL("./packages/console/src/index.ts", import.meta.url),
      ),
      "@moyarich/console-addon-diagnostics": fileURLToPath(
        new URL("./packages/addons/diagnostics/src/index.ts", import.meta.url),
      ),
      "@moyarich/console-addon-data-export": fileURLToPath(
        new URL("./packages/addons/data-export/src/index.ts", import.meta.url),
      ),
      "@moyarich/console-addon-filtering": fileURLToPath(
        new URL("./packages/addons/filtering/src/index.tsx", import.meta.url),
      ),
      "@moyarich/console-addon-markdown": fileURLToPath(
        new URL("./packages/addons/markdown/src/index.tsx", import.meta.url),
      ),
      "@moyarich/console-addon-imperative-scrolling": fileURLToPath(
        new URL(
          "./packages/addons/imperative-scrolling/src/index.ts",
          import.meta.url,
        ),
      ),
      "@moyarich/console-addon-resizable": fileURLToPath(
        new URL("./packages/addons/resizable/src/index.tsx", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: [
            "tests/**/*.test.ts",
            "tests/**/*.test.tsx",
            "packages/addons/*/tests/**/*.test.ts",
            "packages/addons/*/tests/**/*.test.tsx",
          ],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
