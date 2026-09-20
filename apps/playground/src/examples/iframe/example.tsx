import { useEffect, useRef } from "react";
import {
  Console,
  createConsolePostMessageSender,
  listenForConsolePostMessages,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const CHANNEL = "iframe-demo";

const IFRAME_SOURCE = [
  "<!doctype html>",
  "<html>",
  "<body style=\"font-family:system-ui;padding:16px\">",
  "  <button id=\"send\">Send iframe → parent</button>",
  "  <pre id=\"received\">Waiting for parent → iframe…</pre>",
  "  <script>",
  "    document.querySelector(\"#send\").addEventListener(\"click\", () => {",
  "      parent.postMessage({",
  "        type: \"@moyarich/console\",",
  "        version: 1,",
  "        channel: \"iframe-demo\",",
  "        event: {",
  "          type: \"message\",",
  "          message: {",
  "            method: \"log\",",
  "            data: [\"Hello from the iframe\", { frame: true }],",
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
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return listenForConsolePostMessages({
      onEvent,
      channel: CHANNEL,
    });
  }, [onEvent]);

  const sendToIframe = () => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;

    const send = createConsolePostMessageSender({
      targetWindow,
      targetOrigin: "*",
      channel: CHANNEL,
    });

    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: ["Hello from the parent", { parent: true }],
        depth: 0,
        timestamp: Date.now(),
        source: "parent",
      },
    };

    send(event);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button type="button" onClick={sendToIframe}>
        Send parent → iframe
      </button>

      <iframe
        ref={iframeRef}
        title="Console iframe demo"
        srcDoc={IFRAME_SOURCE}
        style={{ width: "100%", minHeight: 180, border: "1px solid #ccc" }}
      />

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received from iframe"
      />
    </div>
  );
}
