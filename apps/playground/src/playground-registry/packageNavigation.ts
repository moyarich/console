import { sentenceCase } from "change-case";
import type { PackageSection } from "./createPackageSections";

export type PackageNavigationItem =
  | { type: "package"; section: PackageSection }
  | {
      type: "directory";
      id: string;
      label: string;
      items: PackageNavigationItem[];
    };

/** Reflect intermediate package directories without inferring groups from names. */
export function createPackageNavigation(
  sections: readonly PackageSection[],
): PackageNavigationItem[] {
  const root: PackageNavigationItem[] = [];
  for (const section of sections) {
    let items = root;
    const parents = section.directory.split("/").slice(0, -1);
    let path = "";
    for (const directory of parents) {
      path = path ? `${path}/${directory}` : directory;
      let group = items.find(
        (item) => item.type === "directory" && item.id === path,
      );
      if (!group) {
        group = {
          type: "directory",
          id: path,
          label: sentenceCase(directory),
          items: [],
        };
        items.push(group);
      }
      if (group.type === "directory") items = group.items;
    }
    items.push({ type: "package", section });
  }
  return root;
}
