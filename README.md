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

`useConsoleMessages()` owns a stable `ConsoleEventChannel`. Pass that channel directly to producers such as `capturePageConsole()`.

```tsx
import { useEffect } from "react";
import {
  Console,
  capturePageConsole,
  useConsoleMessages,
} from "@moyarich/console";

export function PageConsole() {
  const { messages, clear, events } = useConsoleMessages();

  useEffect(() => {
    return capturePageConsole({
      events,
      source: "current-page",
      passThrough: true,
    });
  }, [events]);

  return <Console messages={messages} onClear={clear} />;
}
```

## Capture evaluated/sandboxed code

Use `createConsoleProxy()` when you control the `console` object supplied to evaluated code:

```ts
import { createConsoleProxy } from "@moyarich/console";

const messages = [];
const console = createConsoleProxy(messages);

console.log("hello", { from: "sandbox" });
```

To publish proxy output through an event channel:

```ts
import {
  createConsoleEventChannel,
  createConsoleProxy,
} from "@moyarich/console";

const events = createConsoleEventChannel();
const console = createConsoleProxy({ events });
```

## Fan out console events

A `ConsoleEventChannel` lets multiple independent consumers observe the same event stream without composing producer callbacks.

```ts
import {
  capturePageConsole,
  createConsoleEventChannel,
  createConsoleWebSocketSender,
} from "@moyarich/console";

const events = createConsoleEventChannel();

const stopCapture = capturePageConsole({
  events,
});

const send = createConsoleWebSocketSender({
  socket,
  channel: "session-42",
});

const stopSocket = events.subscribe(send);
const stopAudit = events.subscribe(saveConsoleEvent);
```

Each subscription is independent:

```ts
stopAudit();
stopSocket();
stopCapture();
```

The subscription callback is intentionally kept at the consumer boundary. Producers and transport listeners use the channel directly.

## Iframe transport

Inside the iframe, capture into an event channel and subscribe the postMessage sender:

```ts
import {
  capturePageConsole,
  createConsoleEventChannel,
  createConsolePostMessageSender,
} from "@moyarich/console";

const events = createConsoleEventChannel();

const send = createConsolePostMessageSender({
  targetWindow: window.parent,
  targetOrigin: "https://parent.example.com",
  channel: "preview",
});

const stopForwarding = events.subscribe(send);

const restore = capturePageConsole({
  events,
  source: "iframe",
});
```

In the parent, received transport events publish directly into the channel:

```ts
import {
  createConsoleEventChannel,
  listenForConsolePostMessages,
} from "@moyarich/console";

const events = createConsoleEventChannel();

const stop = listenForConsolePostMessages({
  events,
  channel: "preview",
  source: iframe.contentWindow,
  origin: "https://preview.example.com",
});
```

Use a specific `targetOrigin`/`origin` in production instead of `*`.

## Server / WebSocket transport

Sender:

```ts
import {
  capturePageConsole,
  createConsoleEventChannel,
  createConsoleWebSocketSender,
} from "@moyarich/console";

const socket = new WebSocket("wss://example.com/console");
const events = createConsoleEventChannel();

const send = createConsoleWebSocketSender({
  socket,
  channel: "session-42",
});

const stopSending = events.subscribe(send);
const restore = capturePageConsole({ events });
```

Receiver:

```ts
import {
  createConsoleEventChannel,
  listenForConsoleWebSocket,
} from "@moyarich/console";

const events = createConsoleEventChannel();

const stop = listenForConsoleWebSocket({
  socket,
  channel: "session-42",
  events,
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
