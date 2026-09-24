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
