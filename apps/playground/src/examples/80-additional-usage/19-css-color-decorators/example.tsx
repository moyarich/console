import "./styles.css";

const colors = [
  { label: "Short hex", value: "#06c", className: "swatch-brand" },
  { label: "Alpha hex", value: "#ff6b3580", className: "swatch-alpha" },
  {
    label: "Modern RGB",
    value: "rgb(255 0 127 / 75%)",
    className: "swatch-rgb",
  },
  {
    label: "Legacy RGBA",
    value: "rgba(34, 197, 94, 0.7)",
    className: "swatch-rgba",
  },
  {
    label: "Modern HSL",
    value: "hsl(265 60% 50% / 85%)",
    className: "swatch-hsl",
  },
  {
    label: "Named color",
    value: "rebeccapurple",
    className: "swatch-named",
  },
  {
    label: "Transparent",
    value: "transparent",
    className: "swatch-transparent",
  },
  {
    label: "OKLCH mix",
    value: "color-mix(in oklch, red 40%, blue)",
    className: "swatch-mix-oklch",
  },
  {
    label: "Hue interpolation",
    value: "color-mix(in hsl longer hue, red, blue)",
    className: "swatch-mix-hue",
  },
  {
    label: "Mix with transparency",
    value: "color-mix(in srgb, rebeccapurple 60%, transparent)",
    className: "swatch-mix-alpha",
  },
  {
    label: "Nested mix",
    value: "color-mix(in srgb, color-mix(in srgb, red, blue), white)",
    className: "swatch-mix-nested",
  },
  {
    label: "Relative OKLab",
    value: "oklab(from green l a b / 0.5)",
    className: "swatch-relative-oklab",
  },
  {
    label: "Relative HSL + calc",
    value: "hsl(from red calc(h + 120) s l)",
    className: "swatch-relative-hsl",
  },
  { label: "HWB", value: "hwb(190 10% 15%)", className: "swatch-hwb" },
  { label: "Lab", value: "lab(60% 35 -40)", className: "swatch-lab" },
  { label: "LCH", value: "lch(60% 50 300)", className: "swatch-lch" },
  { label: "OKLCH", value: "oklch(60% 0.15 250)", className: "swatch-oklch" },
  {
    label: "Display P3",
    value: "color(display-p3 0.9 0.2 0.4)",
    className: "swatch-p3",
  },
];

export default function CssColorDecoratorsExample() {
  return (
    <div className="color-example">
      <header>
        <span className="eyebrow">VS Code web extension</span>
        <h2>CSS color decorators</h2>
        <p>
          Open <strong>styles.css</strong> and select a color swatch to use the
          native VS Code color picker.
        </p>
      </header>

      <div className="color-grid">
        {colors.map((color) => (
          <article className="color-card" key={color.label}>
            <div className={`color-preview ${color.className}`} />
            <div>
              <strong>{color.label}</strong>
              <code>{color.value}</code>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
