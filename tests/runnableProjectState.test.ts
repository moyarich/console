import { describe, expect, it } from "vitest";
import {
  createRunnableProjectBaseline,
  createRunnableProjectDraft,
  createRunnableProjectSignature,
} from "../packages/playground/src/components/RunnableExample/runnableProjectState";

describe("runnable example project state", () => {
  it("keeps the reset baseline immutable when the editor changes a draft", () => {
    const baseline = createRunnableProjectBaseline(
      "export default function Example() { return null; }",
      "./example.tsx",
      {
        "./shared.ts": 'export const label = "original";',
      },
    );
    const baselineSignature = createRunnableProjectSignature(baseline);
    const draft = createRunnableProjectDraft(baseline);

    draft["example.tsx"] =
      "export default function Example() { return <div>edited</div>; }";
    draft["shared.ts"] = 'export const label = "edited";';

    expect(createRunnableProjectSignature(baseline)).toBe(baselineSignature);
    expect(baseline["example.tsx"]).toContain("return null");
    expect(baseline["shared.ts"]).toContain("original");

    const resetDraft = createRunnableProjectDraft(baseline);
    expect(resetDraft).toEqual({
      "example.tsx": "export default function Example() { return null; }",
      "shared.ts": 'export const label = "original";',
    });
  });

  it("lets the entry source override a duplicate file-map entry", () => {
    const baseline = createRunnableProjectBaseline(
      "canonical entry",
      "example.tsx",
      {
        "example.tsx": "stale duplicate",
        "shared.ts": "shared",
      },
    );

    expect(baseline["example.tsx"]).toBe("canonical entry");
  });
});
