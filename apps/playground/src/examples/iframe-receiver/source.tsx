import {
  Console,
  listenForConsolePostMessages,
  useConsoleMessages,
} from "@moyarich/console";
import { useEffect } from "react";

const iframeSource = `<!doctype html>
<html>
<body style="font-family:system-ui;padding:16px">
  <button onclick="send()">Send console.log</button>
  <script>
    function send() {
      parent.postMessage({
        type: "@moyarich/console",
        version: 1,
        channel: "preview",
        event: {
          type: "message",
          message: {
            method: "log",
            data: ["Hello from the iframe", { frame: true }],
            depth: 0,
            timestamp: Date.now(),
            source: "iframe"
          }
        }
      }, "*");
    }
  <\/script>
</body>
</html>`;

export default function IframeReceiverExample() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return listenForConsolePostMessages({
      onEvent,
      channel: "preview",
    });
  }, [onEvent]);

  return (
    <section className="workspace">
      <aside className="controls-card">
        <h2>postMessage receiver</h2>
        <p>
          Click the iframe button to send one console event to the parent.
        </p>
        <iframe title="Console iframe demo" srcDoc={iframeSource} />
      </aside>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received through postMessage"
      />
    </section>
  );
}
