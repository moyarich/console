import { useEffect } from "react";
import {
  Console,
  listenForConsoleWebSocket,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const socket = new WebSocket("wss://your-server.example.com/console");

export default function WebSocketConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return listenForConsoleWebSocket({
      socket,
      channel: "console-demo",
      onEvent,
    });
  }, [onEvent]);

  return (
    <Console
      messages={messages}
      onClear={clear}
      subtitle="Received through WebSocket"
    />
  );
}
