export interface Metric {
  kind: "metric";
  label: string;
  value: number;
  unit: string;
  presentation?: "badge" | "default";
}

export function isMetric(value: unknown): value is Metric {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<Metric>;

  return (
    candidate.kind === "metric" &&
    typeof candidate.label === "string" &&
    typeof candidate.value === "number" &&
    typeof candidate.unit === "string"
  );
}
