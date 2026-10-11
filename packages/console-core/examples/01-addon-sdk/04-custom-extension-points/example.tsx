import { useState } from "react";
import {
  createConsoleAddonManager,
  createConsoleExtensionPoint,
  type ConsoleAddon,
} from "@moyarich/console-core";

interface DiagnosticProvider {
  analyze(text: string): string | undefined;
}
const diagnosticProvider = createConsoleExtensionPoint<DiagnosticProvider>(
  "example.diagnostics",
  "first-result",
);

export default function CustomExtensionPointExample() {
  const [text, setText] = useState("ERROR: build failed");
  const [result, setResult] = useState("Not analyzed yet");
  function analyze() {
    const manager = createConsoleAddonManager();
    const addon: ConsoleAddon = {
      id: "example.diagnostics",
      activate(host) {
        host.extensions.register(diagnosticProvider, {
          analyze: (value) =>
            value.includes("ERROR") ? "Failure detected" : undefined,
        });
      },
    };
    try {
      manager.load(addon);
      let diagnosis: string | undefined;
      for (const provider of manager.extensions.getAll(diagnosticProvider)) {
        diagnosis = provider.analyze(text);
        if (diagnosis !== undefined) break;
      }
      setResult(diagnosis ?? "No diagnostic provider handled this text");
    } finally {
      manager.dispose();
    }
  }
  return (
    <div>
      <label>
        Output to analyze{" "}
        <input value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <button type="button" onClick={analyze}>
        Analyze
      </button>
      <p role="status">{result}</p>
    </div>
  );
}
