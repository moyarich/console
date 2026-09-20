import {
  createConsolePostMessageSender,
  type ConsoleEvent,
} from "@moyarich/console";
import { useRef, useState } from "react";

const iframeSource = `<!doctype html>
<html>
<body style="font-family:system-ui;padding:16px">
  <strong>Iframe receiver</strong>
  <pre id="output">Waiting for a message…</pre>
  <script>
    addEventListener("message", (event) => {
      document.querySelector("#output").textContent =
        JSON.stringify(event.data, null, 2);
    });
  <\/script>
</body>
</html>`;

export default function IframeSenderExample() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sent, setSent] = useState(false);

  const sendDemo = () => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;

    const send = createConsolePostMessageSender({
      targetWindow,
      targetOrigin: "*",
      channel: "preview",
    });

    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: ["Hello from the parent", { transported: true }],
        depth: 0,
        timestamp: Date.now(),
        source: "playground",
      },
    };

    send(event);
    setSent(true);
  };

  return (
    <section className="workspace">
      <aside className="controls-card">
        <h2>postMessage sender</h2>
        <p>
          This playground harness sends one console transport envelope to the
          iframe.
        </p>
        <button onClick={sendDemo}>Send console event</button>
        {sent && <p className="hint">Envelope sent to the iframe.</p>}
      </aside>

      <iframe
        ref={iframeRef}
        title="postMessage receiver"
        srcDoc={iframeSource}
      />
    </section>
  );
}
