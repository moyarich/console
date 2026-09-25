import { fileURLToPath, URL } from "node:url";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExportToc from "@stefanprobst/rehype-extract-toc/mdx";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

function workspaceSource(path: string) {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  worker: {
    format: "es",
  },
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [
          remarkFrontmatter,
          remarkGfm,
          [remarkMdxFrontmatter, { name: "meta" }],
        ],
        rehypePlugins: [rehypeSlug, rehypeExtractToc, rehypeExportToc],
      }),
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  resolve: {
    dedupe: ["vscode"],
    alias: [
      {
        find: "@moyarich/console-core",
        replacement: workspaceSource("console-core/src/index.ts"),
      },
      {
        find: "@moyarich/console/styles.css",
        replacement: workspaceSource("console/src/styles.css"),
      },
      {
        find: "@moyarich/console-addon-imperative-scrolling",
        replacement: workspaceSource(
          "addons/imperative-scrolling/src/index.ts",
        ),
      },
      {
        find: "@moyarich/console-addon-diagnostics",
        replacement: workspaceSource("addons/diagnostics/src/index.ts"),
      },
      {
        find: "@moyarich/console-addon-filtering",
        replacement: workspaceSource("addons/filtering/src/index.tsx"),
      },
      {
        find: "@moyarich/console-addon-resizable/styles.css",
        replacement: workspaceSource("addons/resizable/src/styles.css"),
      },
      {
        find: "@moyarich/console-addon-resizable",
        replacement: workspaceSource("addons/resizable/src/index.tsx"),
      },
      {
        find: "@moyarich/console-addon-data-export",
        replacement: workspaceSource("addons/data-export/src/index.ts"),
      },
      {
        find: "@moyarich/console",
        replacement: workspaceSource("console/src/index.ts"),
      },
    ],
  },
});
