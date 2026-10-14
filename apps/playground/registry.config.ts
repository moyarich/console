/** Content sources used by navigation, search indexing, and Vite HMR. */
export default {
  sources: {
    docs: {
      base: "../../docs",
      include: ["**/page.mdx"],
      navigation: { label: "Docs", order: 1 },
    },
    packages: {
      base: "../../packages",
      include: ["*/**/page.mdx", "addons/*/**/page.mdx"],
      metadata: ["*/package.json", "addons/*/package.json"],
      navigation: { label: "Packages", order: 2 },
    },
  },
} as const;
