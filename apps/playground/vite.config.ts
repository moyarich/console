import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@moyarich/console/styles.css",
        replacement: fileURLToPath(
          new URL("../../packages/console/src/styles.css", import.meta.url),
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
