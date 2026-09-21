export interface AnsiSegment {
  text: string;
  style: Record<string, string | number>;
}

const ANSI_COLORS = [
  "#000000",
  "#cd3131",
  "#0dbc79",
  "#e5e510",
  "#2472c8",
  "#bc3fbc",
  "#11a8cd",
  "#e5e5e5",
] as const;

const ANSI_BRIGHT_COLORS = [
  "#666666",
  "#f14c4c",
  "#23d18b",
  "#f5f543",
  "#3b8eea",
  "#d670d6",
  "#29b8db",
  "#ffffff",
] as const;

function ansi256Color(index: number): string {
  if (index < 8) return ANSI_COLORS[index]!;
  if (index < 16) return ANSI_BRIGHT_COLORS[index - 8]!;

  if (index >= 232) {
    const value = 8 + (index - 232) * 10;
    return `rgb(${value} ${value} ${value})`;
  }

  const offset = index - 16;
  const red = Math.floor(offset / 36);
  const green = Math.floor((offset % 36) / 6);
  const blue = offset % 6;
  const channel = (value: number) => (value === 0 ? 0 : 55 + value * 40);

  return `rgb(${channel(red)} ${channel(green)} ${channel(blue)})`;
}

function applyColor(
  style: Record<string, string | number>,
  property: "color" | "backgroundColor",
  codes: number[],
  index: number,
): number {
  const mode = codes[index + 1];

  if (mode === 5 && Number.isInteger(codes[index + 2])) {
    style[property] = ansi256Color(codes[index + 2]!);
    return index + 2;
  }

  if (
    mode === 2 &&
    [codes[index + 2], codes[index + 3], codes[index + 4]].every(
      (value) => Number.isInteger(value),
    )
  ) {
    style[property] = `rgb(${codes[index + 2]} ${codes[index + 3]} ${codes[index + 4]})`;
    return index + 4;
  }

  return index;
}

export function parseAnsi(value: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  const style: Record<string, string | number> = {};
  const pattern = /\u001b\[([0-9;]*)m/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  const pushText = (text: string) => {
    if (text) segments.push({ text, style: { ...style } });
  };

  while ((match = pattern.exec(value))) {
    pushText(value.slice(cursor, match.index));
    cursor = pattern.lastIndex;

    const codes = match[1]
      ? match[1].split(";").map((part) => Number(part || 0))
      : [0];

    for (let index = 0; index < codes.length; index += 1) {
      const code = codes[index]!;

      if (code === 0) {
        for (const key of Object.keys(style)) delete style[key];
      } else if (code === 1) {
        style.fontWeight = 700;
      } else if (code === 2) {
        style.opacity = 0.7;
      } else if (code === 3) {
        style.fontStyle = "italic";
      } else if (code === 4) {
        style.textDecoration = "underline";
      } else if (code === 22) {
        delete style.fontWeight;
        delete style.opacity;
      } else if (code === 23) {
        delete style.fontStyle;
      } else if (code === 24) {
        delete style.textDecoration;
      } else if (code >= 30 && code <= 37) {
        style.color = ANSI_COLORS[code - 30]!;
      } else if (code >= 90 && code <= 97) {
        style.color = ANSI_BRIGHT_COLORS[code - 90]!;
      } else if (code === 39) {
        delete style.color;
      } else if (code >= 40 && code <= 47) {
        style.backgroundColor = ANSI_COLORS[code - 40]!;
      } else if (code >= 100 && code <= 107) {
        style.backgroundColor = ANSI_BRIGHT_COLORS[code - 100]!;
      } else if (code === 49) {
        delete style.backgroundColor;
      } else if (code === 38) {
        index = applyColor(style, "color", codes, index);
      } else if (code === 48) {
        index = applyColor(style, "backgroundColor", codes, index);
      }
    }
  }

  pushText(value.slice(cursor));

  return segments;
}
