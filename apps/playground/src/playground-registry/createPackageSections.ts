import {
  createMdxSection,
  type MdxPageModule,
  type MdxSection,
} from "../content/mdxSection";

export interface PackageSection extends MdxSection {
  directory: string;
}

/** Group discovered documentation and examples by their owning workspace package. */
export function createPackageSections(
  modules: Record<string, MdxPageModule>,
  packages: Record<string, { name: string }>,
): PackageSection[] {
  const grouped = new Map<string, Record<string, MdxPageModule>>();
  const owners = Object.keys(packages)
    .filter((path) => path.endsWith("/package.json"))
    .map((path) => path.slice(2, -"/package.json".length))
    .sort((a, b) => b.length - a.length);

  for (const [path, page] of Object.entries(modules)) {
    if (!path.startsWith("./") || !path.endsWith("/page.mdx")) {
      throw new Error(`Invalid package page path "${path}".`);
    }
    const owner = owners.find((candidate) => path.startsWith(`./${candidate}/`));
    if (!owner) {
      throw new Error(`Missing package metadata for page "${path}".`);
    }
    const relative = path.slice(owner.length + 3);
    const pages = grouped.get(owner) ?? {};
    pages[`./${relative}`] = page;
    grouped.set(owner, pages);
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
