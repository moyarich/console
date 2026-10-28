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
import { sqliteSearchPlugin } from "./vite-sqlite-plugin/index.ts";
import { generateRegistryImports } from "./generateRegistryImports.ts";

generateRegistryImports();
const search = sqliteSearchPlugin();

function workspaceSource(path: string) {
  return fileURLToPath(new URL(`../../packages/${path}`, import.meta.url));
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    port: Number(process.env.DEV_PORT ?? 5173),
    strictPort: true,
    proxy: {
      // Storybook's manager channel and bootstrap modules use root-absolute URLs.
      "/storybook-server-channel": {
        target: `http://127.0.0.1:${process.env.STORYBOOK_DEV_PORT ?? 6007}`,
        ws: true,
      },
      "/vite-inject-mocker-entry.js": {
        target: `http://127.0.0.1:${process.env.STORYBOOK_DEV_PORT ?? 6007}`,
      },
      "/@id/__x00__virtual:/@storybook": {
        target: `http://127.0.0.1:${process.env.STORYBOOK_DEV_PORT ?? 6007}`,
      },
      "/storybook": {
        target: `http://127.0.0.1:${process.env.STORYBOOK_DEV_PORT ?? 6007}`,
        ws: true,
        rewrite: (path) =>
          path.startsWith("/storybook/hmr")
            ? path
            : path.replace(/^\/storybook/, "") || "/",
      },
    },
  },
  worker: {
    format: "es",
  },
  plugins: [
    {
      name: "storybook-dev-redirect",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const url = new URL(request.url ?? "/", "http://localhost");
          if (url.pathname !== "/storybook") return next();
          response.writeHead(302, { Location: `/storybook/${url.search}` });
          response.end();
        });
      },
    },
    search.plugin,
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [
          remarkFrontmatter,
          remarkGfm,
          search.remark,
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
