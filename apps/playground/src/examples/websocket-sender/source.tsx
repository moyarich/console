import {
  createConsoleWebSocketSender,
  type ConsoleEvent,
} from "@moyarich/console";
import { useEffect, useRef, useState } from "react";

const SOCKET_URL = "wss://ws.postman-echo.com/raw";

export default function WebSocketSenderExample() {
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState("disconnected");
  const [echo, setEcho] = useState("");

  useEffect(() => () => socketRef.current?.close(), []);

  const connect = () => {
    socketRef.current?.close();
    setEcho("");
    setStatus("connecting");

    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    socket.addEventListener("open", () => setStatus("connected"));
    socket.addEventListener("close", () => setStatus("disconnected"));
    socket.addEventListener("error", () => setStatus("error"));
    socket.addEventListener("message", (event) => {
      setEcho(typeof event.data === "string" ? event.data : "[binary message]");
    });
  };

  const sendDemo = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const send = createConsoleWebSocketSender({
      socket,
      channel: "console-demo",
    });

    const event: ConsoleEvent = {
      type: "message",
      message: {
        method: "log",
        data: ["Hello through WebSocket"],
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
        <h2>WebSocket sender</h2>
        <p>Postman WebSocket Echo returns the exact envelope that was sent.</p>
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

      <div className="controls-card">
        <h2>Echoed payload</h2>
        <pre className="transport-output">{echo || "Nothing sent yet."}</pre>
      </div>
    </section>
  );
}
