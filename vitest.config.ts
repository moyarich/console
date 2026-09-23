import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@moyarich/console": fileURLToPath(
        new URL("./packages/console/src/index.ts", import.meta.url),
      ),
      "@moyarich/console-addon-diagnostics": fileURLToPath(
        new URL(
          "./packages/console-addon-diagnostics/src/index.ts",
          import.meta.url,
        ),
      ),
      "@moyarich/console-addon-data-export": fileURLToPath(
        new URL(
          "./packages/console-addon-data-export/src/index.ts",
          import.meta.url,
        ),
      ),
      "@moyarich/console-addon-imperative-scrolling": fileURLToPath(
        new URL(
          "./packages/console-addon-imperative-scrolling/src/index.ts",
          import.meta.url,
        ),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
