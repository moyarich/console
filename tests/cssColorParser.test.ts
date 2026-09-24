import { describe, expect, it } from "vitest";
import {
  extractCssColors,
  parseCssColor,
} from "../packages/css-color-parser/src/index";

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
