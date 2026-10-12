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
  return fileURLToPath(new URL(`../../packages/${path}`, import.meta.url));
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
          [remarkMdxFrontmatter, { name: "frontmatter" }],
        ],
        rehypePlugins: [rehypeSlug, rehypeExtractToc, rehypeExportToc],
      }),
    },
    react({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
  resolve: {
    // Preserve Vite browser/module conditions for Monaco while enabling workspace source exports.
    conditions: ["module", "browser", "development|production", "development"],
    dedupe: ["vscode"],
    alias: [
      {
        find: "@src",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "@moyarich/console-core",
        replacement: workspaceSource("console-core/src/index.ts"),
      },
      {
        find: "@moyarich/console/styles.css",
        replacement: workspaceSource("console/src/styles.css"),
      },
      {
        find: "@moyarich/console",
        replacement: workspaceSource("console/src/index.ts"),
      },
    ],
  },
});
