import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
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
