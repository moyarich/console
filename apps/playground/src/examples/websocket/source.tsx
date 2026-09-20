import {
  Console,
  createConsoleWebSocketSender,
  listenForConsoleWebSocket,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import { useEffect, useRef, useState } from "react";

const SOCKET_URL = "wss://ws.postman-echo.com/raw";
const CHANNEL = "console-demo";

export default function WebSocketExample() {
  const { messages, clear, onEvent } = useConsoleMessages({ maxMessages: 500 });
  const socketRef = useRef<WebSocket | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState("disconnected");

  useEffect(
    () => () => {
      cleanupRef.current?.();
      socketRef.current?.close();
    },
    [],
  );

  const connect = () => {
    cleanupRef.current?.();
    socketRef.current?.close();
    clear();
    setStatus("connecting");

    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    cleanupRef.current = listenForConsoleWebSocket({
      socket,
      channel: CHANNEL,
      onEvent,
    });

    socket.addEventListener("open", () => setStatus("connected"));
    socket.addEventListener("close", () => setStatus("disconnected"));
    socket.addEventListener("error", () => setStatus("error"));
  };

  const sendDemo = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const send = createConsoleWebSocketSender({
      socket,
      channel: CHANNEL,
    });

    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: ["Hello through WebSocket", { echoedBy: "Postman" }],
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
        <h2>WebSocket transport</h2>
        <p>
          One socket stays mounted for both sending and receiving. Postman echoes
          the envelope back to the same connection.
        </p>

        <div className="socket-status">
          Status: <strong>{status}</strong>
        </div>

        <div className="button-row">
          <button onClick={connect}>Connect</button>
          <button disabled={status !== "connected"} onClick={sendDemo}>
            Send event
          </button>
        </div>
      </aside>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received through WebSocket"
      />
    </section>
  );
}
