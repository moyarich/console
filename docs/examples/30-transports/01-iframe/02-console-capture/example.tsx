import { useRef, useState } from "react";
import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

const IFRAME_SOURCE = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 18px;
        background: #f8fafc;
        color: #1e293b;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .card {
        display: grid;
        gap: 14px;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 18px;
        background: #fff;
        box-shadow: 0 10px 30px rgb(15 23 42 / 0.07);
      }

      .kicker {
        color: #6366f1;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      h1 {
        margin: 4px 0 0;
        color: #0f172a;
        font-size: 16px;
      }

      button {
        width: fit-content;
        border: 1px solid #4f46e5;
        border-radius: 10px;
        padding: 9px 12px;
        background: #4f46e5;
        color: #fff;
        font: 700 12px/1.2 inherit;
        cursor: pointer;
        box-shadow: 0 5px 14px rgb(79 70 229 / 0.2);
      }

      button:hover {
        background: #4338ca;
      }

    </style>
  </head>
  <body>
    <main class="card">
      <div>
        <span class="kicker">Iframe</span>
        <h1>Plain console.log()</h1>
      </div>

      <button id="log" type="button">
        console.log(...)
      </button>
    </main>

    <script>
      document.querySelector("#log").addEventListener("click", () => {
        console.log("Hello from the iframe", {
          frame: true,
          source: "iframe"
        });
      });
    </script>
  </body>
</html>
`;

export default function IframeConsoleCaptureExample() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeConsole, setIframeConsole] = useState<Console>();

  const { messages, clear } = useConsoleMessages({
    capture: Boolean(iframeConsole),
    consoleTarget: iframeConsole,
    source: "iframe",
    passThrough: true,
  });

  const handleIframeLoad = () => {
    const iframeWindow = iframeRef.current?.contentWindow as
      (Window & typeof globalThis) | null | undefined;

    setIframeConsole(iframeWindow?.console);
  };

  return (
    <div className="iframe-demo">
      <section className="iframe-demo-card">
        <header className="iframe-demo-header">
          <div className="iframe-demo-heading">
            <span className="iframe-demo-kicker">Host page</span>
            <strong>Capture iframe console directly</strong>
          </div>
        </header>

        <iframe
          ref={iframeRef}
          className="iframe-demo-frame"
          title="Iframe console.log capture demo"
          srcDoc={IFRAME_SOURCE}
          onLoad={handleIframeLoad}
        />
      </section>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Captured from iframe.contentWindow.console"
      />
    </div>
  );
}
