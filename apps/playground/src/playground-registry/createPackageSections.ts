import {
  createMdxSection,
  type MdxPageModule,
  type MdxSection,
} from "../utils/mdxSection";

export interface PackageSection extends MdxSection {
  directory: string;
}

/** Group discovered documentation and examples by their owning workspace package. */
export function createPackageSections(
  modules: Record<string, MdxPageModule>,
  packages: Record<string, { name: string }>,
): PackageSection[] {
  const grouped = new Map<string, Record<string, MdxPageModule>>();
  for (const [path, page] of Object.entries(modules)) {
    const match = /^\.\/(.+?)\/examples\/(.+\/)?page\.mdx$/.exec(path);
    if (!match) throw new Error(`Invalid package page path "${path}".`);
    const [, owner, relative = ""] = match;
    const pages = grouped.get(owner!) ?? {};
    pages[`./${relative}page.mdx`] = page;
    grouped.set(owner!, pages);
  }
  for (const owner of grouped.keys()) {
    if (!packages[`./${owner}/package.json`]) {
      throw new Error(`Missing package metadata for "${owner}".`);
    }
  }
  return [...grouped]
    .sort(([a], [b]) =>
      packages[`./${a}/package.json`]!.name.localeCompare(
        packages[`./${b}/package.json`]!.name,
      ),
    )
    .map(([owner, pages]) => {
      const metadata = packages[`./${owner}/package.json`];
      if (!metadata)
        throw new Error(`Missing package metadata for "${owner}".`);
      return {
        directory: owner,
        ...createMdxSection({
          id: `package-${owner.replaceAll("/", "-")}`,
          label: metadata.name,
          modules: pages,
        }),
      };
    });
}
