import { describe, expect, it } from "vitest";
import {
  extractCssColors,
  parseCssColor,
} from "../packages/visualize-css-colors/css-color-parser/src/index";

describe("parseCssColor", () => {
  it("parses short and alpha hex colors", () => {
    expect(parseCssColor("#06c")).toMatchObject({
      format: "hex",
      color: { red: 0, green: 102, blue: 204, alpha: 1 },
    });

    expect(parseCssColor("#ff000080")).toMatchObject({
      format: "hex",
      color: {
        red: 255,
        green: 0,
        blue: 0,
        alpha: 128 / 255,
      },
    });
  });

  it("parses legacy and modern rgb syntax", () => {
    expect(parseCssColor("rgba(255, 0, 127, 0.5)")).toMatchObject({
      format: "rgb",
      color: { red: 255, green: 0, blue: 127, alpha: 0.5 },
    });

    expect(parseCssColor("rgb(100% 0% 50% / 25%)")).toMatchObject({
      format: "rgb",
      color: { red: 255, green: 0, blue: 127.5, alpha: 0.25 },
    });
  });

  it("parses hsl syntax", () => {
    const parsed = parseCssColor("hsl(120 100% 25% / 50%)");

    expect(parsed?.format).toBe("hsl");
    expect(parsed?.color.alpha).toBe(0.5);
    expect(parsed?.color.red).toBeCloseTo(0);
    expect(parsed?.color.green).toBeCloseTo(127.5);
    expect(parsed?.color.blue).toBeCloseTo(0);
  });

  it("parses named colors and transparent", () => {
    expect(parseCssColor("rebeccapurple")).toMatchObject({
      format: "named",
      color: { red: 102, green: 51, blue: 153, alpha: 1 },
    });

    expect(parseCssColor("transparent")).toMatchObject({
      format: "named",
      color: { red: 0, green: 0, blue: 0, alpha: 0 },
    });
  });

  it.each([
    ["color-mix(in srgb, red, blue)", "color-mix", [128, 0, 128, 1]],
    ["color-mix(in srgb, red 25%, blue)", "color-mix", [64, 0, 191, 1]],
    ["color-mix(in srgb, red 20%, blue 20%)", "color-mix", [128, 0, 128, 0.4]],
    [
      "color-mix(in srgb, transparent, red)",
      "color-mix",
      [255, 0, 0, 128 / 255],
    ],
    ["color-mix(in hsl longer hue, red, blue)", "color-mix", [0, 255, 0, 1]],
    ["color-mix(in oklch, red 40%, blue)", "color-mix", [163, 0, 217, 1]],
    ["hwb(120 0% 0%)", "hwb", [0, 255, 0, 1]],
    ["lab(50% 0 0)", "lab", [119, 119, 119, 1]],
    ["lch(50% 0 0)", "lch", [119, 119, 119, 1]],
    ["oklab(50% 0 0)", "oklab", [99, 99, 99, 1]],
    ["oklch(60% 0.15 250)", "oklch", [39, 132, 213, 1]],
    ["color(display-p3 1 0 0)", "color", [255, 0, 0, 1]],
    ["oklab(from green l a b / 0.5)", "oklab", [0, 128, 0, 128 / 255]],
    ["hsl(from red calc(h + 120) s l)", "hsl", [0, 255, 0, 1]],
    ["rgb(from #123456 r g b / 50%)", "rgb", [18, 52, 86, 128 / 255]],
    ["rgb(calc(100 + 155) 0 0)", "rgb", [255, 0, 0, 1]],
    ["COLOR-MIX(in srgb, red, blue)", "color-mix", [128, 0, 128, 1]],
  ] as const)(
    "resolves %s to sRGB",
    (value, format, [red, green, blue, alpha]) => {
      expect(parseCssColor(value)).toEqual({
        value,
        format,
        color: { red, green, blue, alpha },
      });
    },
  );

  it.each([
    "color-mix(in srgb, red 0%, blue 0%)",
    "color-mix(in srgb, red -10%, blue)",
    "color-mix(in imaginary, red, blue)",
    "color-mix(in srgb, red)",
    "color-mix(in srgb, red, blue) trailing",
    "hsl(from red calc(h +) s l)",
    "color-mix(in srgb, var(--brand), blue)",
    "color-mix(in srgb, currentColor, blue)",
    "oklab(from Canvas l a b)",
    "light-dark(red, blue)",
  ])("skips invalid or context-dependent expressions: %s", (value) => {
    expect(parseCssColor(value)).toBeNull();
  });

  it("rejects malformed colors", () => {
    expect(parseCssColor("#fffff")).toBeNull();
    expect(parseCssColor("rgb(1 2)")).toBeNull();
    expect(parseCssColor("hsl(20 30 40)")).toBeNull();
    expect(parseCssColor("not-a-color")).toBeNull();
  });
});

describe("extractCssColors", () => {
  it("returns source offsets for each supported color", () => {
    const source = [
      ":root {",
      "  --brand: #06c;",
      "  --accent: rgb(255 0 0 / 50%);",
      "  color: rebeccapurple;",
      "}",
    ].join("\n");

    const colors = extractCssColors(source);

    expect(colors.map(({ value }) => value)).toEqual([
      "#06c",
      "rgb(255 0 0 / 50%)",
      "rebeccapurple",
    ]);

    for (const color of colors) {
      expect(source.slice(color.start, color.end)).toBe(color.value);
    }
  });

  it("does not treat a named color inside an identifier as a color", () => {
    expect(
      extractCssColors(".red-button { color: red; }").map(({ value }) => value),
    ).toEqual(["red"]);
  });
});

describe("nested color extraction", () => {
  it("returns one full UTF-16 range for a multiline nested mix", () => {
    const value = `color-mix(
      in srgb,
      color-mix(in srgb, red, blue),
      rgb(from white r g b)
    )`;
    const source = `/* 🎨 */ a { color: ${value}; background: #06c; }`;
    const matches = extractCssColors(source);
    expect(matches.map((match) => match.value)).toEqual([value, "#06c"]);
    expect(matches[0]?.color).toEqual({
      red: 192,
      green: 128,
      blue: 192,
      alpha: 1,
    });
    for (const match of matches) {
      expect(source.slice(match.start, match.end)).toBe(match.value);
    }
    expect(matches[0]?.start).toBe(source.indexOf(value));
  });

  it("extracts relative colors and colors inside gradients without overlapping ranges", () => {
    const value = "hsl(from red calc(h + 120) s l)";
    const source = `background: linear-gradient(${value}, oklch(60% 0.15 250));`;
    expect(extractCssColors(source).map((match) => match.value)).toEqual([
      value,
      "oklch(60% 0.15 250)",
    ]);
  });

  it("skips an unresolved mix instead of presenting its arguments as the result", () => {
    expect(
      extractCssColors("color-mix(in srgb, var(--brand), red); blue").map(
        (match) => match.value,
      ),
    ).toEqual(["blue"]);
  });

  it("recovers after an incomplete function at the next declaration", () => {
    expect(
      extractCssColors(
        "color: color-mix(in srgb, red, blue; background: #06c;",
      ).map((match) => match.value),
    ).toEqual(["#06c"]);
  });

  it("does not mistake a function name for a named color", () => {
    expect(
      extractCssColors("transform: rotate(calc(tan(45deg))); color: tan").map(
        (match) => match.value,
      ),
    ).toEqual(["tan"]);
  });

  it("does not match colors embedded in identifiers or invalid hex tokens", () => {
    expect(
      extractCssColors("my-oklch(60% 0.15 250) #ffffffoops --red red-button"),
    ).toEqual([]);
  });
});
