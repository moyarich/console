import { afterEach, describe, expect, it } from "vitest";
import {
  compileExampleProject,
  type CompiledExampleRuntime,
} from "../apps/playground/src/components/RunnableExample/compileExampleProject";

const runtimes: CompiledExampleRuntime[] = [];

async function compile(
  entryPath: string,
  files: Record<string, string>,
  runtimeModules?: Record<string, unknown>,
) {
  const runtime = await compileExampleProject({
    entryPath,
    files,
    runtimeModules,
  });
  runtimes.push(runtime);
  return runtime;
}

afterEach(() => {
  for (const runtime of runtimes.splice(0)) {
    runtime.dispose();
  }
});

describe("runnable example project compilation", () => {
  it("compiles a single-file React entry", async () => {
    const runtime = await compile("example.tsx", {
      "example.tsx": `
        export default function Example() {
          return <div>hello</div>;
        }
      `,
    });

    expect(runtime.Component).toBeTypeOf("function");
  });

  it("resolves relative imports with extension and index resolution", async () => {
    const runtime = await compile("src/example.tsx", {
      "src/example.tsx": `
        import { label } from "./shared";
        import { suffix } from "./features";
        export default function Example() {
          return <div>{label}{suffix}</div>;
        }
      `,
      "src/shared.ts": `export const label = "ready";`,
      "src/features/index.ts": `export const suffix = "!";`,
    });

    expect(runtime.Component).toBeTypeOf("function");
  });

  it("supports circular local modules", async () => {
    const runtime = await compile("example.tsx", {
      "example.tsx": `
        import { a } from "./a";
        export default function Example() {
          return <div>{a}</div>;
        }
      `,
      "a.ts": `
        import { b } from "./b";
        export const a = "a" + b;
      `,
      "b.ts": `
        import "./a";
        export const b = "b";
      `,
    });

    expect(runtime.Component).toBeTypeOf("function");
  });

  it("supports JSON, raw source, and host-provided runtime modules", async () => {
    const runtime = await compile(
      "example.tsx",
      {
        "example.tsx": `
          import config from "./config.json";
          import raw from "./message.txt?raw";
          import { value } from "example-runtime";
          export default function Example() {
            return <div>{config.label}{raw}{value}</div>;
          }
        `,
        "config.json": `{"label":"config"}`,
        "message.txt": "raw",
      },
      {
        "example-runtime": { value: "runtime" },
      },
    );

    expect(runtime.Component).toBeTypeOf("function");
  });

  it("supports dynamic local and runtime imports", async () => {
    const runtime = await compile(
      "example.tsx",
      {
        "example.tsx": `
          export async function load() {
            const local = await import("./lazy");
            const external = await import("example-runtime");
            return [local.value, external.value];
          }

          export default function Example() {
            return <div>dynamic</div>;
          }
        `,
        "lazy.ts": `export const value = "local";`,
      },
      {
        "example-runtime": { value: "runtime" },
      },
    );

    expect(runtime.Component).toBeTypeOf("function");
  });


  it("prevents disposed runtimes from reloading local modules", async () => {
    const scope = globalThis as typeof globalThis & {
      __loadRunnableModule?: () => Promise<unknown>;
    };

    const runtime = await compile("example.tsx", {
      "example.tsx": `
        globalThis.__loadRunnableModule = () => import("./lazy");
        export default function Example() {
          return <div>disposed runtime</div>;
        }
      `,
      "lazy.ts": `export const value = "late";`,
    });

    const load = scope.__loadRunnableModule;
    expect(load).toBeTypeOf("function");

    runtime.dispose();

    await expect(load?.()).rejects.toThrow(/disposed/);
    delete scope.__loadRunnableModule;
  });

  it("allows type-only relative imports without a runtime file", async () => {
    const runtime = await compile("example.tsx", {
      "example.tsx": `
        import type { Props } from "./types";
        export default function Example(_props: Props) {
          return <div />;
        }
      `,
    });

    expect(runtime.Component).toBeTypeOf("function");
  });

  it("reports unresolved relative imports with available files", async () => {
    await expect(
      compileExampleProject({
        entryPath: "example.tsx",
        files: {
          "example.tsx":
            'import "./missing"; export default function Example() { return <div />; }',
          "shared.ts": "export const value = 1;",
        },
      }),
    ).rejects.toThrow(/Unable to resolve.*missing.*shared\.ts/s);
  });

  it("rejects unknown bare imports unless supplied by the host", async () => {
    await expect(
      compileExampleProject({
        entryPath: "example.tsx",
        files: {
          "example.tsx":
            'import "unknown-package"; export default function Example() { return <div />; }',
        },
      }),
    ).rejects.toThrow(/Provide it through runtimeModules/);
  });
});
