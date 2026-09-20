import {
  Console,
  capturePageConsole,
  createConsoleWebSocketSender,
  listenForConsolePostMessages,
  listenForConsoleWebSocket,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import { useEffect, useRef, useState } from "react";

type SourceMode = "page" | "iframe" | "server";

const iframeSource = `<!doctype html>
<html>
<head><style>body{font-family:system-ui;padding:18px;background:#f8fafc;color:#172033}button{margin:4px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:white;cursor:pointer}</style></head>
<body>
  <strong>Iframe runtime</strong>
  <p>These buttons transport console events to the parent with postMessage.</p>
  <button onclick="send('log','hello from iframe',{frame:true,count:3})">console.log</button>
  <button onclick="send('warn','iframe warning')">console.warn</button>
  <button onclick="send('error','iframe error')">console.error</button>
  <button onclick="send('table',[{name:'margin',value:'10px'},{name:'padding',value:'8px'}])">console.table</button>
  <button onclick="clearConsole()">console.clear</button>
  <script>
    function emit(event) {
      parent.postMessage({type:'@moyarich/console',version:1,channel:'iframe-demo',event}, '*');
    }
    function send(method, ...data) {
      emit({type:'message',message:{method,data,depth:0,timestamp:Date.now(),source:'iframe'}});
    }
    function clearConsole(){ emit({type:'clear'}); }
  <\/script>
</body>
</html>`;

export function App() {
  const [mode, setMode] = useState<SourceMode>("page");
  const { messages, clear, onEvent } = useConsoleMessages({ maxMessages: 500 });
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8080");
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const socketRef = useRef<WebSocket | null>(null);
  const socketCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    clear();

    if (mode === "page") {
      return capturePageConsole({ onEvent, source: "current-page" });
    }

    if (mode === "iframe") {
      return listenForConsolePostMessages({ onEvent, channel: "iframe-demo" });
    }
  }, [clear, mode, onEvent]);

  useEffect(() => () => {
    socketCleanupRef.current?.();
    socketRef.current?.close();
  }, []);

  const disconnectSocket = () => {
    socketCleanupRef.current?.();
    socketCleanupRef.current = null;
    socketRef.current?.close();
    socketRef.current = null;
    setSocketStatus("disconnected");
  };

  const connectSocket = () => {
    disconnectSocket();
    clear();
    setSocketStatus("connecting");
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;
    socket.addEventListener("open", () => setSocketStatus("connected"));
    socket.addEventListener("close", () => setSocketStatus("disconnected"));
    socket.addEventListener("error", () => setSocketStatus("error"));
    socketCleanupRef.current = listenForConsoleWebSocket({
      socket,
      channel: "server-demo",
      onEvent,
    });
  };

  const sendSocketDemo = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const send = createConsoleWebSocketSender({ socket, channel: "server-demo" });
    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: ["message sent through WebSocket transport", { url: socketUrl }],
        depth: 0,
        timestamp: Date.now(),
        source: "playground",
      },
    };
    send(event);
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <span className="eyebrow">@moyarich/console</span>
        <h1>Console transport playground</h1>
        <p>One React console UI for the current page, iframes, and messages relayed across a server.</p>
      </header>

      <nav className="source-tabs" aria-label="Console source">
        <button className={mode === "page" ? "active" : ""} onClick={() => setMode("page")}>Current page</button>
        <button className={mode === "iframe" ? "active" : ""} onClick={() => setMode("iframe")}>Iframe</button>
        <button className={mode === "server" ? "active" : ""} onClick={() => setMode("server")}>Server / WebSocket</button>
      </nav>

      <section className="workspace">
        <aside className="controls-card">
          {mode === "page" && (
            <>
              <h2>Current page</h2>
              <p><code>capturePageConsole()</code> patches this page&apos;s console and forwards each event to the React store.</p>
              <div className="button-stack">
                <button onClick={() => console.log("hello", { package: "@moyarich/console", ok: true })}>console.log</button>
                <button onClick={() => console.warn("warning from the current page")}>console.warn</button>
                <button onClick={() => console.error("error from the current page")}>console.error</button>
                <button onClick={() => console.table([{ name: "margin", value: "10px" }, { name: "padding", value: "8px" }])}>console.table</button>
                <button onClick={() => { console.group("group"); console.log("nested message"); console.groupEnd(); }}>console.group</button>
              </div>
            </>
          )}

          {mode === "iframe" && (
            <>
              <h2>Iframe transport</h2>
              <p>The parent listens with <code>listenForConsolePostMessages()</code>. The embedded frame sends the same versioned transport envelope.</p>
              <iframe title="Console iframe demo" srcDoc={iframeSource} />
            </>
          )}

          {mode === "server" && (
            <>
              <h2>Server transport</h2>
              <p>Connect to a WebSocket relay. The server only needs to relay the JSON envelope unchanged.</p>
              <label>
                WebSocket URL
                <input value={socketUrl} onChange={(event) => setSocketUrl(event.target.value)} />
              </label>
              <div className="socket-status">Status: <strong>{socketStatus}</strong></div>
              <div className="button-row">
                <button onClick={connectSocket}>Connect</button>
                <button onClick={disconnectSocket}>Disconnect</button>
              </div>
              <button disabled={socketStatus !== "connected"} onClick={sendSocketDemo}>Send demo event</button>
              <p className="hint">If the relay echoes the message, it will appear in the console panel.</p>
            </>
          )}
        </aside>

        <Console
          messages={messages}
          onClear={clear}
          subtitle={mode === "page" ? "Captured from this page" : mode === "iframe" ? "Received through postMessage" : "Received through WebSocket"}
        />
      </section>
    </main>
  );
}
