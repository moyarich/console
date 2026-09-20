import {
  Console,
  createConsolePostMessageSender,
  listenForConsolePostMessages,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import { useEffect, useRef, useState } from "react";

const CHANNEL = "preview";

const iframeSource = `<!doctype html>
<html>
<body style="font-family:system-ui;padding:16px">
  <strong>Iframe runtime</strong>
  <p>Both sides stay mounted while messages move in either direction.</p>
  <button onclick="sendToParent()">Send iframe → parent</button>
  <pre id="received">Waiting for parent → iframe…</pre>

  <script>
    function sendToParent() {
      parent.postMessage({
        type: "@moyarich/console",
        version: 1,
        channel: "preview",
        event: {
          type: "message",
          message: {
            method: "log",
            data: ["Hello from the iframe", { direction: "iframe → parent" }],
            depth: 0,
            timestamp: Date.now(),
            source: "iframe"
          }
        }
      }, "*");
    }

    addEventListener("message", (event) => {
      document.querySelector("#received").textContent =
        JSON.stringify(event.data, null, 2);
    });
  <\/script>
</body>
</html>`;

export default function IframeExample() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { messages, clear, onEvent } = useConsoleMessages({ maxMessages: 500 });
  const [sentToIframe, setSentToIframe] = useState(false);

  useEffect(() => {
    return listenForConsolePostMessages({
      onEvent,
      channel: CHANNEL,
      source: iframeRef.current?.contentWindow ?? undefined,
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
        data: ["Hello from the parent", { direction: "parent → iframe" }],
        depth: 0,
        timestamp: Date.now(),
        source: "parent",
      },
    };

    send(event);
    setSentToIframe(true);
  };

  return (
    <section className="workspace">
      <aside className="controls-card">
        <h2>Iframe transport</h2>
        <p>
          Sender and receiver stay active together. Use either direction without
          changing the playground example.
        </p>

        <button onClick={sendToIframe}>Send parent → iframe</button>
        {sentToIframe && <p className="hint">Envelope sent to the iframe.</p>}

        <iframe
          ref={iframeRef}
          title="Console iframe demo"
          srcDoc={iframeSource}
        />
      </aside>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received from iframe"
      />
    </section>
  );
}
