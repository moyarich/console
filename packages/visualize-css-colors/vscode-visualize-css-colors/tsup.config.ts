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
    dts: false,
    clean: false,
    external: ["vscode"],
    noExternal: ["@moyarich/css-color-parser"],
    outExtension() {
      return { js: ".js" };
    },
  },
]);
