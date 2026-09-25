export default {
  title: "Colors in source code",
  description: "The same provider inspects CSS color strings in TypeScript.",
  fileName: "colors.ts",
  source:
    'const theme = {\n  accent: "color-mix(in oklch, red 40%, blue)",\n  text: "rebeccapurple",\n  relative: "hsl(from red calc(h + 120) s l)",\n};\n',
};
