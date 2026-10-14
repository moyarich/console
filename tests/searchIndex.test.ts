import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";
import remarkSearchIndex from "../apps/playground/src/search-sqlite/remarkSearchIndex";

describe("build-time search index", () => {
  it("indexes prose, headings, inline and fenced code, and imported raw examples", async () => {
    const directory = await mkdtemp(join(tmpdir(), "console-search-"));
    try {
      await writeFile(
        join(directory, "example.tsx"),
        "console.info('embedded-example-token');",
      );
      const compiled = String(
        await compile(
          {
            path: join(directory, "page.mdx"),
            value: `import source from "./example.tsx?raw";
import PrivateImplementation from "./private.tsx";

# Lifecycle heading

Reconnect **dropped sessions** with \`readyState\`.

\`\`\`ts
console.warn("fenced-code-token");
\`\`\`

<RunnableExample source={source} />`,
          },
          { remarkPlugins: [remarkSearchIndex] },
        ),
      );
      const exported = compiled
        .split("export const searchText = ")[1]
        ?.split(";\n")[0];
      expect(exported).toBeTruthy();
      const text = JSON.parse(exported!);
      for (const term of [
        "Lifecycle heading",
        "dropped sessions",
        "readyState",
        "fenced-code-token",
        "embedded-example-token",
      ]) {
        expect(text).toContain(term);
      }
      expect(text).not.toContain("PrivateImplementation");
      expect(text).not.toContain("RunnableExample");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("fails the build when an embedded example cannot be indexed", async () => {
    await expect(
      compile(
        {
          path: join(tmpdir(), "missing-page.mdx"),
          value: 'import source from "./nonexistent-example.tsx?raw";',
        },
        { remarkPlugins: [remarkSearchIndex] },
      ),
    ).rejects.toThrow();
  });
});
