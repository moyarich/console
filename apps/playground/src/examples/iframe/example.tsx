import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  createConsolePostMessageSender,
  listenForConsolePostMessages,
  useConsoleMessages,
} from "@moyarich/console";
import "@moyarich/console/styles.css";

const CHANNEL = "preview";

export function startIframeConsoleForwarding() {
  const send = createConsolePostMessageSender({
    targetWindow: window.parent,
    targetOrigin: window.location.origin,
    channel: CHANNEL,
  });

  return capturePageConsole({
    onEvent: send,
    source: "iframe",
    passThrough: true,
  });
}

export default function IframeConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return listenForConsolePostMessages({
      onEvent,
      channel: CHANNEL,
      origin: window.location.origin,
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
