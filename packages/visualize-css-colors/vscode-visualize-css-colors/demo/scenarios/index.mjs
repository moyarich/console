import { globSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const scenarioFiles = globSync("**/*.mjs", {
  cwd: import.meta.dirname,
  exclude: ["**/index.mjs"],
}).sort();

export const scenarios = Object.freeze(
  Object.fromEntries(
    await Promise.all(
      scenarioFiles.map(async (file) => {
        const name = path.basename(file, ".mjs");
        const filePath = path.join(import.meta.dirname, file);
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
