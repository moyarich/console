import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  addons: [],
  viteFinal: (config) =>
    mergeConfig(config, {
      esbuild: { jsx: "automatic" },
      resolve: {
        alias: [
          {
            find: "@moyarich/console/styles.css",
            replacement: fileURLToPath(
              new URL("../packages/console/src/styles.css", import.meta.url),
            ),
          },
          {
            find: "@moyarich/console-addon-imperative-scrolling",
            replacement: fileURLToPath(
              new URL(
                "../packages/console-addon-imperative-scrolling/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-diagnostics",
            replacement: fileURLToPath(
              new URL(
                "../packages/console-addon-diagnostics/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-data-export",
            replacement: fileURLToPath(
              new URL(
                "../packages/console-addon-data-export/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console",
            replacement: fileURLToPath(
              new URL("../packages/console/src/index.ts", import.meta.url),
            ),
          },
        ],
      },
    }),
};

export default config;
