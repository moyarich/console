import { useRef, useState } from "react";
import { Console, type ConsoleStdoutEntry } from "@moyarich/console";
import "@moyarich/console/styles.css";

const PYODIDE_VERSION = "314.0.7";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

interface PyodideGlobals {
  set(name: string, value: unknown): void;
}

interface PyodideRuntime {
  globals: PyodideGlobals;
  loadPackage(name: string): Promise<void>;
  runPythonAsync(code: string): Promise<unknown>;
}

type LoadPyodide = (options: { indexURL: string }) => Promise<PyodideRuntime>;

type PyodideGlobalScope = typeof globalThis & {
  loadPyodide?: LoadPyodide;
};

let runtimePromise: Promise<PyodideRuntime> | undefined;
let scriptPromise: Promise<void> | undefined;

async function loadPyodideScript(): Promise<void> {
  const scope = globalThis as PyodideGlobalScope;

  if (scope.loadPyodide) {
    return;
  }

  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-console-pyodide="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Unable to load the Pyodide browser script.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.dataset.consolePyodide = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Unable to load the Pyodide browser script.")),
      { once: true },
    );
    document.head.append(script);
  });

  await scriptPromise;

  if (!scope.loadPyodide) {
    throw new Error("Pyodide loaded without exposing globalThis.loadPyodide.");
  }
}

async function getPyodideRuntime(): Promise<PyodideRuntime> {
  runtimePromise ??= (async () => {
    await loadPyodideScript();

    const scope = globalThis as PyodideGlobalScope;
    const loadPyodide = scope.loadPyodide;

    if (!loadPyodide) {
      throw new Error("Pyodide loader is unavailable.");
    }

    const runtime = await loadPyodide({
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

# Pyodide does not provide Python threading in this configuration.
# Disabling tqdm's optional monitor avoids TqdmMonitorWarning.
tqdm.monitor_interval = 0

class BrowserTqdmStream:
    encoding = "utf-8"

    def write(self, text):
        text = str(text)
        emit_tqdm_chunk(text)
        return len(text)

    def flush(self):
        pass

    def isatty(self):
        return True

stream = BrowserTqdmStream()

async def run_tqdm_demo():
    for _ in tqdm(
        range(100),
        desc="Downloading",
        unit="item",
        mininterval=0,
        miniters=1,
        ncols=88,
        ascii=False,
        file=stream,
    ):
        await asyncio.sleep(0.04)

    emit_stdout_chunk("Python task complete\\n")

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

      runtime.globals.set("emit_tqdm_chunk", (text: string) => {
        append(text, "stderr");
      });
      runtime.globals.set("emit_stdout_chunk", (text: string) => {
        append(text, "stdout");
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
        Pyodide is loaded through its browser script so this example also works
        in the playground&apos;s editable-source runner. The real tqdm formatter
        writes to a custom Python file-like stream, and every exact write,
        including its carriage return, is forwarded directly into the console.
      </p>

      <Console
        mode="ansi"
        title="Pyodide + tqdm"
        subtitle="Live tqdm carriage-return writes streamed directly into the console"
        messages={messages}
        resizable="vertical"
        style={{ height: 420, minHeight: 240, maxHeight: 720 }}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
