export default {
  title: "Relative colors and modern spaces",
  description:
    "Relative channels, calc(), OKLCH, and Display P3 resolve to sRGB swatches.",
  fileName: "relative.css",
  source:
    ":root {\n  --relative: hsl(from red calc(h + 120) s l);\n  --alpha: oklab(from green l a b / 0.5);\n  --oklch: oklch(60% 0.15 250);\n  --p3: color(display-p3 0.9 0.2 0.4);\n}\n",
};
