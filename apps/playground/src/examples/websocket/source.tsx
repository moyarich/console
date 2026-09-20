import {
  Console,
  createConsoleWebSocketSender,
  listenForConsoleWebSocket,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import { useEffect, useRef, useState } from "react";

export default function WebSocketExample() {
  const { messages, clear, onEvent } = useConsoleMessages({ maxMessages: 500 });
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8080");
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const socketRef = useRef<WebSocket | null>(null);
  const socketCleanupRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      socketCleanupRef.current?.();
      socketRef.current?.close();
    },
    [],
  );

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

    const send = createConsoleWebSocketSender({
      socket,
      channel: "server-demo",
    });

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
    <section className="workspace">
      <aside className="controls-card">
        <h2>Server transport</h2>
        <p>
          Connect to a WebSocket relay. The server only needs to relay the JSON
          envelope unchanged.
        </p>

        <label>
          WebSocket URL
          <input
            value={socketUrl}
            onChange={(event) => setSocketUrl(event.target.value)}
          />
        </label>

        <div className="socket-status">
          Status: <strong>{socketStatus}</strong>
        </div>

        <div className="button-row">
          <button onClick={connectSocket}>Connect</button>
          <button onClick={disconnectSocket}>Disconnect</button>
        </div>

        <button
          disabled={socketStatus !== "connected"}
          onClick={sendSocketDemo}
        >
          Send demo event
        </button>

        <p className="hint">
          If the relay echoes the message, it will appear in the console panel.
        </p>
      </aside>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received through WebSocket"
      />
    </section>
  );
}
