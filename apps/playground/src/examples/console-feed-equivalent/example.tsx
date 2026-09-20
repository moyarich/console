import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const LogsContainer = () => {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      target: window.console,
      passThrough: true,
    });
  }, [events]);

  return <Console messages={messages} onClear={clear} />;
};

export { LogsContainer };
