import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const addonDirectories = [
  "data-export",
  "diagnostics",
  "imperative-scrolling",
] as const;

describe("addon dependency boundary", () => {
  for (const directory of addonDirectories) {
    it(`${directory} depends on console-core, not console`, () => {
      const packageRoot = resolve(
        process.cwd(),
        "packages",
        "addons",
        directory,
      );
      const packageJson = JSON.parse(
        readFileSync(resolve(packageRoot, "package.json"), "utf8"),
      ) as Record<string, Record<string, string> | undefined>;
      const source = readFileSync(
        resolve(packageRoot, "src", "index.ts"),
        "utf8",
      );
      const tsconfig = JSON.parse(
        readFileSync(resolve(packageRoot, "tsconfig.json"), "utf8"),
      ) as {
        compilerOptions?: {
          paths?: Record<string, string[]>;
        };
      };

      for (const section of [
        "dependencies",
        "peerDependencies",
        "devDependencies",
      ] as const) {
        expect(packageJson[section]?.["@moyarich/console"]).toBeUndefined();
      }

      expect(
        packageJson.peerDependencies?.["@moyarich/console-core"],
      ).toBeDefined();
      expect(source).not.toMatch(
        /from\s+["']@moyarich\/console["']|import\s+["']@moyarich\/console["']/,
      );
      expect(source).toContain("@moyarich/console-core");
      expect(
        tsconfig.compilerOptions?.paths?.["@moyarich/console"],
      ).toBeUndefined();
      expect(
        tsconfig.compilerOptions?.paths?.["@moyarich/console-core"],
      ).toBeDefined();
    });
  }
});
