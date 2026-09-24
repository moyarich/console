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
