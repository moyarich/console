import { globSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const scenarioGroups = [
  {
    directory: import.meta.dirname,
    pattern: "*.mjs",
    exclude: ["index.mjs"],
  },
  {
    directory: path.join(import.meta.dirname, "../generated-scenarios"),
    pattern: "*.scenario.mjs",
  },
];

const scenarioFiles = scenarioGroups.flatMap(
  ({ directory, pattern, exclude = [] }) =>
    globSync(pattern, {
      cwd: directory,
      exclude,
    }).map((file) => ({
      directory,
      file,
    })),
);

export const scenarios = Object.freeze(
  Object.fromEntries(
    await Promise.all(
      scenarioFiles.map(async ({ directory, file }) => {
        const name = path.basename(file).replace(/\.scenario\.mjs$|\.mjs$/, "");
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
