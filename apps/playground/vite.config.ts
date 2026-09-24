import { fileURLToPath, URL } from "node:url";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: "meta" }],
        ],
      }),
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  resolve: {
    alias: [
      {
        find: "@moyarich/console-core",
        replacement: fileURLToPath(
          new URL("../../packages/console-core/src/index.ts", import.meta.url),
        ),
      },
      {
        find: "@moyarich/console/styles.css",
        replacement: fileURLToPath(
          new URL("../../packages/console/src/styles.css", import.meta.url),
        ),
      },
      {
        find: "@moyarich/console-addon-imperative-scrolling",
        replacement: fileURLToPath(
          new URL(
            "../../packages/addons/imperative-scrolling/src/index.ts",
            import.meta.url,
          ),
        ),
      },
      {
        find: "@moyarich/console-addon-diagnostics",
        replacement: fileURLToPath(
          new URL(
            "../../packages/addons/diagnostics/src/index.ts",
            import.meta.url,
          ),
        ),
      },
      {
        find: "@moyarich/console-addon-resizable/styles.css",
        replacement: fileURLToPath(
          new URL(
            "../../packages/addons/resizable/src/styles.css",
            import.meta.url,
          ),
        ),
      },
      {
        find: "@moyarich/console-addon-resizable",
        replacement: fileURLToPath(
          new URL(
            "../../packages/addons/resizable/src/index.tsx",
            import.meta.url,
          ),
        ),
      },
      {
        find: "@moyarich/console-addon-data-export",
        replacement: fileURLToPath(
          new URL(
            "../../packages/addons/data-export/src/index.ts",
            import.meta.url,
          ),
        ),
      },
      {
        find: "@moyarich/console",
        replacement: fileURLToPath(
          new URL("../../packages/console/src/index.ts", import.meta.url),
        ),
      },
    ],
  },
});
