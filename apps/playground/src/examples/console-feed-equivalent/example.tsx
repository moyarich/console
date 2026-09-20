import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const LogsContainer = () => {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      target: window.console,
      passThrough: true,
    });
  }, [onEvent]);

  return <Console messages={messages} onClear={clear} />;
};

export { LogsContainer };
