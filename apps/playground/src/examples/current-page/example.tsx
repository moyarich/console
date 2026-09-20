import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

export default function CurrentPageConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "current-page",
      passThrough: true,
    });
  }, [onEvent]);

  return (
    <Console
      messages={messages}
      onClear={clear}
      subtitle="Captured from this page"
    />
  );
}
