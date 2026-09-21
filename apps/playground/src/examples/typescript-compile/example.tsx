import { useState } from "react";
import * as ts from "typescript";
import {
  Console,
  createConsoleProxy,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const TYPESCRIPT_SOURCE = `
interface User {
  name: string;
  score: number;
}

const user: User = {
  name: "Ada",
  score: 42,
};

console.log("Compiled TypeScript", user);
`;

export default function TypeScriptCompileExample() {
  const { messages, clear, events } = useConsoleMessages();
  const [compiledJavaScript, setCompiledJavaScript] = useState("");

  const compileAndRun = () => {
    const result = ts.transpileModule(TYPESCRIPT_SOURCE, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None,
      },
    });

    setCompiledJavaScript(result.outputText);

    const runtimeConsole = createConsoleProxy({
      events,
      source: "typescript-compile",
    });

    new Function("console", result.outputText)(runtimeConsole);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button type="button" onClick={compileAndRun}>
        Compile and run TypeScript
      </button>

      <section className="controls-card">
        <h2>TypeScript source</h2>
        <pre className="transport-output">{TYPESCRIPT_SOURCE}</pre>
      </section>

      {compiledJavaScript && (
        <section className="controls-card">
          <h2>Compiled JavaScript</h2>
          <pre className="transport-output">{compiledJavaScript}</pre>
        </section>
      )}

      <Console
        messages={messages}
        onClear={clear}
        subtitle="console.log output from compiled TypeScript"
      />
    </div>
  );
}
