import {
  capturePageConsole,
  createConsolePostMessageSender,
} from "@moyarich/console";

const send = createConsolePostMessageSender({
  targetWindow: window.parent,
  targetOrigin: "*",
  channel: "preview",
});

export const stopForwardingConsole = capturePageConsole({
  onEvent: send,
  source: "iframe",
  passThrough: true,
});
