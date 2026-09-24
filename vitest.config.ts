import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
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
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
