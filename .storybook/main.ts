import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import type { StorybookConfig } from "@storybook/react-vite";
import { persistenceLogsPlugin } from "./persistence-logs";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  addons: [],
  viteFinal: (config) =>
    mergeConfig(config, {
      esbuild: { jsx: "automatic" },
      plugins: [persistenceLogsPlugin()],
      worker: {
        format: "es",
      },
      resolve: {
        dedupe: ["vscode"],
        alias: [
          {
            find: "@moyarich/console-addon-animation",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/animation/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-metadata",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/metadata/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-navigation",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/navigation/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-session",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/session/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-links",
            replacement: fileURLToPath(
              new URL("../packages/addons/links/src/index.ts", import.meta.url),
            ),
          },
          {
            find: "@moyarich/console-addon-process-state",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/process-state/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-search",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/search/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-selection",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/selection/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-annotations",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/annotations/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-console-feed",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/console-feed/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-xterm",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/xterm/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-core",
            replacement: fileURLToPath(
              new URL("../packages/console-core/src/index.ts", import.meta.url),
            ),
          },
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
                "../packages/addons/imperative-scrolling/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-diagnostics",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/diagnostics/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-filtering",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/filtering/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-persistence",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/persistence/src/index.ts",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-markdown",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/markdown/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-resizable/styles.css",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/resizable/src/styles.css",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-resizable",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/resizable/src/index.tsx",
                import.meta.url,
              ),
            ),
          },
          {
            find: "@moyarich/console-addon-data-export",
            replacement: fileURLToPath(
              new URL(
                "../packages/addons/data-export/src/index.ts",
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
