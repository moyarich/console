import {
  Console,
  createConsoleWebSocketSender,
  listenForConsoleWebSocket,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import { useEffect, useRef, useState } from "react";

const SOCKET_URL = "wss://ws.postman-echo.com/raw";

export default function WebSocketReceiverExample() {
  const { messages, clear, onEvent } = useConsoleMessages();
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState("disconnected");

  useEffect(() => () => socketRef.current?.close(), []);

  const connect = () => {
    socketRef.current?.close();
    clear();
    setStatus("connecting");

    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    const stopListening = listenForConsoleWebSocket({
      socket,
      channel: "console-demo",
      onEvent,
    });

    socket.addEventListener("open", () => {
      setStatus("connected");

      const send = createConsoleWebSocketSender({
        socket,
        channel: "console-demo",
      });

      const event: ConsoleEvent = {
        type: "message",
        message: {
          method: "log",
          data: ["Echoed back into the Console", { received: true }],
          depth: 0,
          timestamp: Date.now(),
          source: "postman-echo",
        },
      };

      send(event);
    });

    socket.addEventListener("close", () => {
      stopListening();
      setStatus("disconnected");
    });

    socket.addEventListener("error", () => setStatus("error"));
  };

  return (
    <section className="workspace">
      <aside className="controls-card">
        <h2>WebSocket receiver</h2>
        <p>
          Connect to Postman WebSocket Echo. The playground sends one envelope
          so the receiver can display the echoed event.
        </p>
        <div className="socket-status">
          Status: <strong>{status}</strong>
        </div>
        <button onClick={connect}>Connect and receive event</button>
      </aside>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received through WebSocket"
      />
    </section>
  );
}
