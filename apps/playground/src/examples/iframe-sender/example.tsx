import {
  createConsolePostMessageSender,
  type ConsoleEvent,
} from "@moyarich/console";

const send = createConsolePostMessageSender({
  targetWindow: window.parent,
  targetOrigin: window.location.origin,
  channel: "preview",
});

const event: ConsoleEvent = {
  type: "message",
  message: {
    method: "log",
    data: ["Hello from the iframe"],
    depth: 0,
    timestamp: Date.now(),
    source: "iframe",
  },
};

send(event);
