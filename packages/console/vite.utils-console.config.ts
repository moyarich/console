import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const entry = fileURLToPath(
  new URL("./src/utils/console/index.ts", import.meta.url),
);

export default defineConfig({
  build: {
    target: "es2022",
    outDir: "dist/utils/console",
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    lib: {
      entry,
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      external: [
        "@moyarich/console-core",
        "anser",
        "lucide-react",
        "react",
        "react-dom",
        "react/jsx-runtime",
      ],
    },
  },
});
