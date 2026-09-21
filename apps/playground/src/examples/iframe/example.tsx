import { useEffect, useRef } from "react";
import {
  Console,
  CONSOLE_TRANSPORT_TYPE,
  CONSOLE_TRANSPORT_VERSION,
  listenForConsolePostMessages,
  serializeConsoleEvent,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const CHANNEL = "iframe-demo";

const IFRAME_SOURCE = [
  "<!doctype html>",
  "<html>",
  "<head>",
  "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
  "  <style>",
  "    * { box-sizing: border-box; }",
  "    html, body { min-height: 100%; }",
  "    body {",
  "      margin: 0;",
  "      padding: 18px;",
  "      background: #f8fafc;",
  "      color: #1e293b;",
  "      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;",
  "    }",
  "    .frame-card {",
  "      display: grid;",
  "      gap: 16px;",
  "      min-height: 100%;",
  "      border: 1px solid #e2e8f0;",
  "      border-radius: 16px;",
  "      padding: 16px;",
  "      background: #fff;",
  "      box-shadow: 0 10px 30px rgb(15 23 42 / 0.07);",
  "    }",
  "    .frame-header {",
  "      display: flex;",
  "      align-items: center;",
  "      justify-content: space-between;",
  "      gap: 16px;",
  "    }",
  "    .frame-copy { display: grid; gap: 3px; }",
  "    .frame-kicker {",
  "      color: #6366f1;",
  "      font-size: 11px;",
  "      font-weight: 800;",
  "      letter-spacing: 0.1em;",
  "      text-transform: uppercase;",
  "    }",
  "    .frame-title {",
  "      margin: 0;",
  "      color: #0f172a;",
  "      font-size: 15px;",
  "      font-weight: 750;",
  "    }",
  "    button {",
  "      border: 1px solid #4f46e5;",
  "      border-radius: 10px;",
  "      padding: 9px 12px;",
  "      background: #4f46e5;",
  "      color: #fff;",
  "      font: 700 12px/1.2 inherit;",
  "      cursor: pointer;",
  "      box-shadow: 0 4px 12px rgb(79 70 229 / 0.2);",
  "      transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease;",
  "    }",
  "    button:hover {",
  "      background: #4338ca;",
  "      transform: translateY(-1px);",
  "      box-shadow: 0 7px 18px rgb(79 70 229 / 0.24);",
  "    }",
  "    .received {",
  "      display: grid;",
  "      gap: 8px;",
  "      min-height: 108px;",
  "      border-radius: 12px;",
  "      padding: 12px;",
  "      background: #0f172a;",
  "      color: #cbd5e1;",
  "    }",
  "    .received-label {",
  "      color: #94a3b8;",
  "      font-size: 10px;",
  "      font-weight: 800;",
  "      letter-spacing: 0.08em;",
  "      text-transform: uppercase;",
  "    }",
  "    pre {",
  "      margin: 0;",
  "      white-space: pre-wrap;",
  "      overflow-wrap: anywhere;",
  "      font: 11px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
  "    }",
  "  </style>",
  "</head>",
  "<body>",
  "  <main class=\"frame-card\">",
  "    <div class=\"frame-header\">",
  "      <div class=\"frame-copy\">",
  "        <span class=\"frame-kicker\">Iframe</span>",
  "        <p class=\"frame-title\">Embedded window</p>",
  "      </div>",
  "      <button id=\"send\">Send to host page</button>",
  "    </div>",
  "    <div class=\"received\">",
  "      <span class=\"received-label\">Received from host page</span>",
  "      <pre id=\"received\">No console event received yet.</pre>",
  "    </div>",
  "  </main>",
  "  <script>",
  "    document.querySelector(\"#send\").addEventListener(\"click\", () => {",
  "      window.parent.postMessage({",
  "        type: \"CONSOLE_PANEL\",",
  "        version: 1,",
  "        channel: \"iframe-demo\",",
  "        event: {",
  "          type: \"message\",",
  "          message: {",
  "            method: \"log\",",
  "            data: [\"Console event sent from iframe to host page\", { frame: true }],",
  "            depth: 0,",
  "            timestamp: Date.now(),",
  "            source: \"iframe\"",
  "          },",
  "        },",
  "      }, \"*\");",
  "    });",
  "",
  "    addEventListener(\"message\", (event) => {",
  "      document.querySelector(\"#received\").textContent =",
  "        JSON.stringify(event.data, null, 2);",
  "    });",
  "  </script>",
  "</body>",
  "</html>",
].join("\n");

export default function IframeConsole() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return listenForConsolePostMessages({
      events,
      channel: CHANNEL,
    });
  }, [events]);

  const sendToIframe = () => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;

    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: [
          "Console event sent from host page to iframe",
          { host: true },
        ],
        depth: 0,
        timestamp: Date.now(),
        source: "host-page",
      },
    };

    targetWindow.postMessage(
      {
        type: CONSOLE_TRANSPORT_TYPE,
        version: CONSOLE_TRANSPORT_VERSION,
        channel: CHANNEL,
        event: serializeConsoleEvent(event),
      },
      "*",
    );
  };

  return (
    <div className="iframe-demo">
      <section className="iframe-demo-card">
        <header className="iframe-demo-header">
          <div className="iframe-demo-heading">
            <span className="iframe-demo-kicker">Host page</span>
            <strong>Window.postMessage transport</strong>
            <span>Send a console event into the embedded iframe.</span>
          </div>

          <button
            type="button"
            className="iframe-demo-send"
            onClick={sendToIframe}
          >
            Send to iframe
          </button>
        </header>

        <iframe
          ref={iframeRef}
          className="iframe-demo-frame"
          title="Console iframe demo"
          srcDoc={IFRAME_SOURCE}
        />
      </section>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Console events received from iframe"
      />
    </div>
  );
}
