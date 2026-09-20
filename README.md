# @moyarich/console

A reusable React console UI with capture and transport adapters for:

- the current browser page
- iframes via `postMessage`
- server-relayed messages via WebSocket
- sandboxed/evaluated code through a `Console` proxy

The project was extracted from the console implementation originally used by the `css-expand-collapse` playground.

## Repository structure

```text
apps/
  playground/          Interactive demo for page, iframe, and WebSocket sources
packages/
  console/             Published @moyarich/console package
stories/               Storybook stories
tests/                 Unit/rendering/transport tests
.github/workflows/     CI and GitHub Packages publishing
```

## Install from GitHub Packages

Configure the `@moyarich` scope for GitHub Packages:

```ini
@moyarich:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
npm install @moyarich/console
```

Import the component and package styles:

```tsx
import { Console } from "@moyarich/console";
import "@moyarich/console/styles.css";
```

## Controlled Console

```tsx
import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export function Example() {
  const { messages, clear } = useConsoleMessages();

  return <Console messages={messages} onClear={clear} />;
}
```

`Console` also accepts the original playground-style `output={{ messages, error }}` prop.

## Capture the current page

`capturePageConsole()` temporarily wraps standard `console.*` methods. By default the original browser console still receives the calls.

```tsx
import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";

export function PageConsole() {
  const { messages, clear, onEvent } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      onEvent,
      source: "current-page",
      passThrough: true,
    });
  }, [onEvent]);

  return <Console messages={messages} onClear={clear} />;
}
```

## Capture evaluated/sandboxed code

Use `createConsoleProxy()` when you control the `console` object supplied to evaluated code:

```ts
import { createConsoleProxy } from "@moyarich/console";

const messages = [];
const runtimeConsole = createConsoleProxy(messages);

runtimeConsole.log("hello", { from: "sandbox" });
```

It supports common methods including `log`, `debug`, `info`, `warn`, `error`, `assert`, `dir`, `table`, `count`, timers, traces, and groups.

## Fan out console events

Use `createConsoleEventChannel()` when one console event should be consumed by multiple independent parts of your app.

```ts
import {
  capturePageConsole,
  createConsoleEventChannel,
  createConsoleWebSocketSender,
} from "@moyarich/console";

const events = createConsoleEventChannel();

const stopCapture = capturePageConsole({
  onEvent: events.emit,
});

const stopUi = events.subscribe(consoleState.onEvent);

const send = createConsoleWebSocketSender({
  socket,
  channel: "session-42",
});

const stopSocket = events.subscribe(send);
```

Each subscription is independent and returns its own cleanup function:

```ts
stopUi();
stopSocket();
stopCapture();
```

For a single consumer, passing an `onEvent` callback directly is still the simplest option. The event channel is intended for fan-out, not as a replacement for the existing callback APIs.

## Iframe transport

Inside the iframe, forward captured events to the parent:

```ts
import {
  capturePageConsole,
  createConsolePostMessageSender,
} from "@moyarich/console";

const send = createConsolePostMessageSender({
  targetWindow: window.parent,
  targetOrigin: "https://parent.example.com",
  channel: "preview",
});

const restore = capturePageConsole({
  onEvent: send,
  source: "iframe",
});
```

In the parent:

```ts
import { listenForConsolePostMessages } from "@moyarich/console";

const stop = listenForConsolePostMessages({
  channel: "preview",
  source: iframe.contentWindow,
  origin: "https://preview.example.com",
  onEvent,
});
```

Use a specific `targetOrigin`/`origin` in production instead of `*`.

## Server / WebSocket transport

The transport envelope is JSON-safe and versioned. A server can relay it without understanding the console payload.

Sender:

```ts
import {
  capturePageConsole,
  createConsoleWebSocketSender,
} from "@moyarich/console";

const socket = new WebSocket("wss://example.com/console");
const send = createConsoleWebSocketSender({ socket, channel: "session-42" });

const restore = capturePageConsole({ onEvent: send });
```

Receiver:

```ts
import { listenForConsoleWebSocket } from "@moyarich/console";

const stop = listenForConsoleWebSocket({
  socket,
  channel: "session-42",
  onEvent,
});
```

A relay server only needs to forward the incoming message string to the intended recipient(s):

```js
wss.on("connection", (socket) => {
  socket.on("message", (data) => {
    for (const client of wss.clients) {
      if (client !== socket && client.readyState === 1) {
        client.send(data);
      }
    }
  });
});
```

## Transport protocol

Messages are transported as:

```ts
{
  type: "CONSOLE_PANEL",
  version: 1,
  channel: "default",
  event: {
    type: "message",
    message: {
      method: "log",
      data: ["hello"],
      depth: 0,
      timestamp: 0,
      source: "page"
    }
  }
}
```

`clear` is represented as `{ type: "clear" }` in the `event` field.

Values are normalized before transport so BigInt, functions, symbols, `undefined`, errors, dates, regular expressions, and circular references do not break JSON serialization.

## Development

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
npm run storybook
```

## Publishing

`packages/console/package.json` publishes to `https://npm.pkg.github.com` as `@moyarich/console`.

The **Publish GitHub Package** workflow runs when a GitHub Release is published, or manually through `workflow_dispatch`. It uses the repository `GITHUB_TOKEN` with `packages: write`; no npmjs token is required.
