# @moyarich/css-color-parser

Framework-agnostic CSS color parsing used by editor integrations.

```ts
import { extractCssColors, parseCssColor } from "@moyarich/css-color-parser";

parseCssColor("#06c");
// {
//   value: "#06c",
//   format: "hex",
//   color: { red: 0, green: 102, blue: 204, alpha: 1 },
// }

extractCssColors("a { color: #06c; background: rebeccapurple; }");
```

The package has no dependency on VS Code, Monaco, React, or browser DOM APIs. Extracted
colors include absolute source offsets so editor adapters can translate them into their
own range types.

Supported color forms currently include:

- `#rgb`, `#rgba`, `#rrggbb`, and `#rrggbbaa`
- `rgb()` and `rgba()`, including modern space/slash syntax
- `hsl()` and `hsla()`, including modern space/slash syntax
- CSS named colors and `transparent`

- `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, and `color()`
- `color-mix()`, including nested mixes, weights, alpha, and hue interpolation
- Relative color functions and `calc()` channels, such as
  `hsl(from red calc(h + 120) s l)`

Advanced functions use [`color-bits/css`](https://github.com/romgrk/color-bits).
They resolve to 8-bit sRGB channels (alpha is divided by 255); wide-gamut colors
are clipped to sRGB. Existing simple RGB/HSL parsing retains floating-point precision.

```ts
parseCssColor("color-mix(in srgb, red, blue)");
// { value: "color-mix(in srgb, red, blue)", format: "color-mix",
//   color: { red: 128, green: 0, blue: 128, alpha: 1 } }

parseCssColor("oklab(from green l a b / 0.5)");
parseCssColor("hsl(from red calc(h + 120) s l)");
```

Extraction consumes each complete color function as a single range, including
nested parentheses and multiline expressions. It does not return overlapping
matches for the arguments. This lets editor integrations replace the entire
expression when a user chooses a different color.

No CSS cascade or DOM context is inferred: `var()`, `currentColor`, system colors,
and `light-dark()` cannot be resolved to a single color. Invalid or unresolved
colors return `null`; an unresolved supported function is skipped as a whole by
extraction. Other containers, such as gradients and `light-dark()`, can still expose
their literal color arguments without computing the container's result.
