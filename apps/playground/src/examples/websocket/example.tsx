import { useEffect, useState } from "react";
import {
  Console,
  listenForConsoleWebSocket,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";
import { sendConsoleEvent } from "./sender";
import { socket } from "./socket";

export default function WebSocketConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();
  const [connected, setConnected] = useState(
    socket.readyState === WebSocket.OPEN,
  );

  useEffect(() => {
    const handleOpen = () => setConnected(true);
    const handleClose = () => setConnected(false);

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("close", handleClose);

    const stopListening = listenForConsoleWebSocket({
      socket,
      channel: "console-demo",
      onEvent,
    });

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("close", handleClose);
      stopListening();
    };
  }, [onEvent]);

  return (
    <>
      <button disabled={!connected} onClick={sendConsoleEvent}>
        Send console event
      </button>

      <Console
        messages={messages}
        onClear={clear}
        subtitle="Received through WebSocket"
      />
    </>
  );
}
