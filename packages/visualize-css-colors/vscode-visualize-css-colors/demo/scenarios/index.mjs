import basicColors from "./basic-colors.mjs";
import colorMix from "./color-mix.mjs";
import relativeColors from "./relative-colors.mjs";
import sourceColors from "./source-colors.mjs";

export const scenarios = Object.freeze({
  "basic-colors": basicColors,
  "color-mix": colorMix,
  "relative-colors": relativeColors,
  "source-colors": sourceColors,
});
export function selectScenarios(selection = "all") {
  const names =
    selection === "all"
      ? Object.keys(scenarios)
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
      `Unknown demo scenario: ${selection}. Available: ${Object.keys(scenarios).join(", ")}`,
    );
  }
  return names;
}
