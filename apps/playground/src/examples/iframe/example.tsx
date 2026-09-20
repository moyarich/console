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
  "  <button id=\"send\">Send console event to parent</button>",
  "  <pre id=\"received\">No console event received from parent yet.</pre>",
  "  <script>",
  "    document.querySelector(\"#send\").addEventListener(\"click\", () => {",
  "      parent.postMessage({",
  "        type: \"CONSOLE_PANEL\",",
  "        version: 1,",
  "        channel: \"iframe-demo\",",
  "        event: {",
  "          type: \"message\",",
  "          message: {",
  "            method: \"log\",",
  "            data: [\"Console event sent from iframe to parent\", { frame: true }],",
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

    const send = createConsolePostMessageSender({
      targetWindow,
      targetOrigin: "*",
      channel: CHANNEL,
    });

    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: ["Console event sent from parent to iframe", { parent: true }],
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
        Send console event to iframe
      </button>

      <iframe
        ref={iframeRef}
        title="Console iframe demo"
        srcDoc={IFRAME_SOURCE}
        style={{
          width: "100%",
          minHeight: 180,
          border: "1px solid #ccc",
        }}
      />

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Console events received from iframe"
      />
    </div>
  );
}
