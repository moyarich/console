export default {
  title: "CSS color-mix()",
  description:
    "Inspect the resolved mix; nested functions form one editable color range.",
  fileName: "mix.css",
  source:
    ":root {\n  --mix: color-mix(in oklch, red 40%, blue);\n  --hue: color-mix(in hsl longer hue, red, blue);\n  --nested: color-mix(in srgb, color-mix(in srgb, red, blue), white);\n}\n",
};
