import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const entry = fileURLToPath(new URL("./src/index.tsx", import.meta.url));

export default defineConfig({
  build: {
    target: "es2022",
    minify: false,
    sourcemap: false,
    lib: {
      entry,
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      external: ["@moyarich/console-core", "react", "react/jsx-runtime"],
    },
  },
});
