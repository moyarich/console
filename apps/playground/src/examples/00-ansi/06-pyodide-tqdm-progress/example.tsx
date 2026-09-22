import { useRef, useState } from "react";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import "@moyarich/console/styles.css";

const PYODIDE_VERSION = "314.0.7";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;

interface PyodideWriter {
  isatty: boolean;
  getTerminalSize(): { columns: number; rows: number };
  write(buffer: Uint8Array): number;
}

interface PyodideRuntime {
  loadPackage(name: string): Promise<void>;
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(handler: PyodideWriter): void;
  setStderr(handler: PyodideWriter): void;
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
        range(100),
        desc="Downloading",
        unit="item",
        mininterval=0,
        miniters=1,
        dynamic_ncols=True,
    ):
        await asyncio.sleep(0.04)

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

    const createWriter = (
      stream: ConsoleStdoutEntry["stream"],
    ): PyodideWriter => {
      const decoder = new TextDecoder();

      return {
        isatty: true,
        getTerminalSize: () => ({ columns: 88, rows: 24 }),
        write: (buffer) => {
          append(decoder.decode(buffer, { stream: true }), stream);
          return buffer.length;
        },
      };
    };

    setMessages([]);
    setStatus("loading");

    try {
      const runtime = await getPyodideRuntime();

      runtime.setStdout(createWriter("stdout"));
      runtime.setStderr(createWriter("stderr"));

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
              ? "Streaming tqdm..."
              : "Run live tqdm progress"}
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
        Pyodide exposes stdout/stderr as TTY-like byte writers here. Each real
        tqdm write is decoded and appended immediately, so carriage-return
        updates redraw one logical console line while the Python loop runs.
        Network access is required for the first Pyodide load.
      </p>

      <Console
        mode="ansi"
        title="Pyodide + tqdm"
        subtitle="Live Python tqdm progress streamed through real stderr writes"
        messages={messages}
        resizable="vertical"
        style={{ height: 420, minHeight: 240, maxHeight: 720 }}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
