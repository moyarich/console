import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
  },
  {
    entry: {
      extension: "src/extension.ts",
    },
    outDir: "dist",
    format: ["cjs"],
    platform: "browser",
    target: "es2022",
    bundle: true,
    splitting: false,
    dts: true,
    clean: false,
    external: ["vscode"],
    noExternal: ["@moyarich/css-color-parser", /^color-bits(?:\/|$)/],
    outExtension() {
      return { js: ".cjs" };
    },
  },
]);
