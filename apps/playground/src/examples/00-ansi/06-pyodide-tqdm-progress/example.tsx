import { useRef, useState } from "react";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import "@moyarich/console/styles.css";

const PYODIDE_VERSION = "314.0.7";
const PYODIDE_INDEX_URL =
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;

type BatchedStreamHandler = {
  batched: (output: string) => void;
};

interface PyodideRuntime {
  loadPackage(name: string): Promise<void>;
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(handler: BatchedStreamHandler): void;
  setStderr(handler: BatchedStreamHandler): void;
}

interface PyodideModule {
  loadPyodide(options: { indexURL: string }): Promise<PyodideRuntime>;
}

let runtimePromise: Promise<PyodideRuntime> | undefined;

async function getPyodideRuntime(): Promise<PyodideRuntime> {
  runtimePromise ??= (async () => {
    const pyodideModule = (await import(
      /* @vite-ignore */ PYODIDE_MODULE_URL
    )) as PyodideModule;
    const runtime = await pyodideModule.loadPyodide({
      indexURL: PYODIDE_INDEX_URL,
    });

    await runtime.loadPackage("tqdm");
    return runtime;
  })();

  return runtimePromise;
}

const PYTHON_SOURCE = `
import asyncio
from tqdm import tqdm

async def run_tqdm_demo():
    for _ in tqdm(
        range(24),
        desc="tqdm in Pyodide",
        unit="step",
        mininterval=0,
        miniters=1,
    ):
        await asyncio.sleep(0.06)

    print("Python task complete")

await run_tqdm_demo()
`;

type RunStatus = "idle" | "loading" | "running" | "done" | "error";

export default function PyodideTqdmProgressExample() {
  const [messages, setMessages] = useState<ConsoleStdoutEntry[]>([]);
  const [status, setStatus] = useState<RunStatus>("idle");
  const runIdRef = useRef(0);

  const run = async () => {
    const runId = ++runIdRef.current;
    let sequence = 0;

    const append = (data: string, stream: ConsoleStdoutEntry["stream"]) => {
      if (!data) {
        return;
      }

      sequence += 1;
      setMessages((current) => [
        ...current,
        {
          id: `pyodide-${runId}-${stream ?? "output"}-${sequence}`,
          data,
          stream,
        },
      ]);
    };

    setMessages([]);
    setStatus("loading");

    try {
      const runtime = await getPyodideRuntime();

      runtime.setStdout({
        batched: (output) => append(output, "stdout"),
      });
      runtime.setStderr({
        batched: (output) => append(output, "stderr"),
      });

      setStatus("running");
      await runtime.runPythonAsync(PYTHON_SOURCE);
      setStatus("done");
    } catch (error) {
      append(
        `Pyodide error: ${error instanceof Error ? error.message : String(error)}\n`,
        "stderr",
      );
      setStatus("error");
    }
  };

  const isRunning = status === "loading" || status === "running";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="button-row">
        <button type="button" onClick={() => void run()} disabled={isRunning}>
          {status === "loading"
            ? "Loading Pyodide + tqdm..."
            : status === "running"
              ? "Running tqdm..."
              : "Run real tqdm progress"}
        </button>

        <button
          type="button"
          onClick={() => setMessages([])}
          disabled={isRunning || messages.length === 0}
        >
          Clear
        </button>
      </div>

      <p style={{ margin: 0 }}>
        This loads Pyodide as an ES module in the browser, imports its bundled
        <code> tqdm </code>
        package, and sends the library&apos;s real stdout/stderr writes directly
        to the console. Network access is required for the first load.
      </p>

      <Console
        mode="ansi"
        title="Pyodide + tqdm"
        subtitle="Real Python tqdm carriage-return progress rendered in the browser"
        messages={messages}
        resizable="vertical"
        style={{ height: 420, minHeight: 240, maxHeight: 720 }}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
