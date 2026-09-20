import { useEffect } from "react";
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

export default function WebSocketConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL);

    const stopListening = listenForConsoleWebSocket({
      socket,
      channel: CHANNEL,
      onEvent,
    });

    const handleOpen = () => {
      const send = createConsoleWebSocketSender({
        socket,
        channel: CHANNEL,
      });

      const event: ConsoleEvent = {
        type: "message",
        message: {
          method: "log",
          data: ["Hello through WebSocket", { connected: true }],
          depth: 0,
          timestamp: Date.now(),
          source: "websocket",
        },
      };

      send(event);
    };

    socket.addEventListener("open", handleOpen);

    return () => {
      socket.removeEventListener("open", handleOpen);
      stopListening();
      socket.close();
    };
  }, [onEvent]);

  return (
    <Console
      messages={messages}
      onClear={clear}
      subtitle="Received through WebSocket"
    />
  );
}
