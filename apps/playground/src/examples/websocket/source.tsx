import {
  Console,
  createConsoleWebSocketSender,
  listenForConsoleWebSocket,
  useConsoleMessages,
  type ConsoleEvent,
} from "@moyarich/console";
import { useEffect, useRef, useState } from "react";

type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

const DEFAULT_SOCKET_URL = "wss://echo.websocket.org";

export default function WebSocketExample() {
  const { messages, clear, onEvent } = useConsoleMessages({ maxMessages: 500 });
  const [socketUrl, setSocketUrl] = useState(DEFAULT_SOCKET_URL);
  const [socketStatus, setSocketStatus] =
    useState<SocketStatus>("disconnected");
  const [socketError, setSocketError] = useState("");
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
    const socket = socketRef.current;

    socketCleanupRef.current?.();
    socketCleanupRef.current = null;
    socketRef.current = null;

    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close();
    }

    setSocketStatus("disconnected");
  };

  const connectSocket = () => {
    disconnectSocket();
    clear();
    setSocketError("");
    setSocketStatus("connecting");

    let socket: WebSocket;

    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      setSocketStatus("error");
      setSocketError(
        error instanceof Error ? error.message : "Unable to create WebSocket.",
      );
      return;
    }

    socketRef.current = socket;

    socketCleanupRef.current = listenForConsoleWebSocket({
      socket,
      channel: "server-demo",
      onEvent,
    });

    socket.addEventListener("open", () => {
      if (socketRef.current !== socket) return;
      setSocketStatus("connected");
    });

    socket.addEventListener("close", () => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      socketCleanupRef.current?.();
      socketCleanupRef.current = null;
      setSocketStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      if (socketRef.current !== socket) return;
      setSocketStatus("error");
      setSocketError(
        "The WebSocket connection failed. Check the URL or try the public echo server.",
      );
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
        data: [
          "message sent through WebSocket transport",
          { url: socketUrl, echoed: true },
        ],
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
          The demo uses a public secure WebSocket echo server by default, so it
          works without starting a local relay. Replace the URL with your own
          relay when needed.
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

        {socketError && <p className="socket-error">{socketError}</p>}

        <div className="button-row">
          <button
            disabled={socketStatus === "connecting"}
            onClick={connectSocket}
          >
            {socketStatus === "connecting" ? "Connecting…" : "Connect"}
          </button>
          <button
            disabled={socketStatus === "disconnected"}
            onClick={disconnectSocket}
          >
            Disconnect
          </button>
        </div>

        <button
          disabled={socketStatus !== "connected"}
          onClick={sendSocketDemo}
        >
          Send demo event
        </button>

        <p className="hint">
          Connect, then send a demo event. The echo server returns the transport
          envelope and it appears in the console panel.
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
