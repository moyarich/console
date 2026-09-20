import { useEffect } from "react";
import {
  Console,
  listenForConsolePostMessages,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function IframeConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return listenForConsolePostMessages({
      onEvent,
      channel: "preview",
    });
  }, [onEvent]);

  return (
    <Console
      messages={messages}
      onClear={clear}
      subtitle="Received through postMessage"
    />
  );
}
