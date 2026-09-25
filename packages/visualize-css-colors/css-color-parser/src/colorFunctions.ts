import type { CssColorFormat } from "./types";

export const CSS_COLOR_FUNCTION_FORMATS: ReadonlyMap<string, CssColorFormat> =
  new Map([
    ["rgb", "rgb"],
    ["rgba", "rgb"],
    ["hsl", "hsl"],
    ["hsla", "hsl"],
    ["hwb", "hwb"],
    ["lab", "lab"],
    ["lch", "lch"],
    ["oklab", "oklab"],
    ["oklch", "oklch"],
    ["color", "color"],
    ["color-mix", "color-mix"],
  ]);
