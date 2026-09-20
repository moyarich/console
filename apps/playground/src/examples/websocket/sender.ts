import {
  createConsoleWebSocketSender,
  type ConsoleEvent,
} from "@moyarich/console";
import { socket } from "./socket";

export function sendConsoleEvent() {
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
      source: "browser",
    },
  };

  send(event);
}
