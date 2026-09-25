import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  worker: {
    format: "es",
  },
  plugins: [],
  resolve: {
    dedupe: ["vscode"],
    alias: [
      {
        find: "@moyarich/console-core",
        replacement: fileURLToPath(
          new URL("../../packages/console-core/src/index.ts", import.meta.url),
        ),
      },
    ],
  },
});
