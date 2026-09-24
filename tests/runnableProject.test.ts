import { describe, expect, it } from "vitest";
import {
  cloneRunnableProjectFiles,
  createCanonicalProjectFiles,
  createRunnableProjectSignature,
} from "../apps/playground/src/components/RunnableExample/runnableProject";

describe("runnable project reset state", () => {
  it("keeps canonical reset files separate from editor drafts", () => {
    const canonical = createCanonicalProjectFiles(
      "export default function Example() {}",
      "example.tsx",
      {
        "shared.ts": 'export const label = "original";',
      },
    );
    const canonicalSignature = createRunnableProjectSignature(canonical);
    const draft = cloneRunnableProjectFiles(canonical);

    draft["example.tsx"] = "edited entry";
    draft["shared.ts"] = "edited shared";

    expect(canonical["example.tsx"]).toBe(
      "export default function Example() {}",
    );
    expect(canonical["shared.ts"]).toBe('export const label = "original";');
    expect(createRunnableProjectSignature(canonical)).toBe(canonicalSignature);

    const reset = cloneRunnableProjectFiles(canonical);

    expect(reset).toEqual(canonical);
    expect(reset).not.toBe(canonical);
    expect(reset["example.tsx"]).not.toBe(draft["example.tsx"]);
    expect(reset["shared.ts"]).not.toBe(draft["shared.ts"]);
  });

  it("lets the entry source override a duplicate files entry", () => {
    const canonical = createCanonicalProjectFiles(
      "canonical entry",
      "./example.tsx",
      {
        "example.tsx": "stale entry",
        "./shared.ts": "shared",
      },
    );

    expect(canonical["example.tsx"]).toBe("canonical entry");
    expect(canonical["shared.ts"]).toBe("shared");
  });
});
