import { globSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const scenarioDirectories = [
  import.meta.dirname,
  path.join(import.meta.dirname, "../generated-scenarios"),
];

const scenarioFiles = scenarioDirectories.flatMap((directory) =>
  globSync("*.mjs", {
    cwd: directory,
    exclude: ["index.mjs"],
  }).map((file) => ({
    directory,
    file,
  })),
);

export const scenarios = Object.freeze(
  Object.fromEntries(
    await Promise.all(
      scenarioFiles.map(async ({ directory, file }) => {
        const name = path.basename(file).replace(/(?:\.spec)?\.mjs$/, "");
        const filePath = path.join(directory, file);
        const module = await import(pathToFileURL(filePath).href);

        return [name, module.default];
      }),
    ),
  ),
);

export function selectScenarios(selection = "all") {
  const available = Object.keys(scenarios);

  const names =
    selection === "all"
      ? available
      : [
          ...new Set(
            selection
              .split(",")
              .map((name) => name.trim())
              .filter(Boolean),
          ),
        ];

  if (!names.length || names.some((name) => !Object.hasOwn(scenarios, name))) {
    throw new Error(
      `Unknown demo scenario: ${selection}. Available: ${available.join(", ")}`,
    );
  }

  return names;
}
