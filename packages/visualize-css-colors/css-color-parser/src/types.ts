export type CssColorFormat =
  | "hex"
  | "rgb"
  | "hsl"
  | "hwb"
  | "lab"
  | "lch"
  | "oklab"
  | "oklch"
  | "color"
  | "color-mix"
  | "named";

export interface RgbaColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface CssColorMatch {
  value: string;
  start: number;
  end: number;
  format: CssColorFormat;
  color: RgbaColor;
}
