import { useEffect, useRef, useState } from "react";
import {
  Console,
  createConsoleWebSocketSender,
  listenForConsoleWebSocket,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const SOCKET_URL = "wss://ws.postman-echo.com/raw";
const CHANNEL = "console-demo";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

export default function WebSocketConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");

  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    const stopListening = listenForConsoleWebSocket({
      socket,
      channel: CHANNEL,
      onEvent,
    });

    const handleOpen = () => setStatus("connected");
    const handleClose = () => setStatus("disconnected");
    const handleError = () => setStatus("error");

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);
      stopListening();
      socket.close();
    };
  }, [onEvent]);

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
        source: "browser",
      },
    };

    send(event);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        Status: <strong>{status}</strong>
      </div>

      <button
        type="button"
        disabled={status !== "connected"}
        onClick={sendDemo}
      >
        Send console event
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received through WebSocket"
      />
    </div>
  );
}
