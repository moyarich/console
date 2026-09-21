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

Turn on page capture directly through `useConsoleMessages()`. The hook starts and cleans up `capturePageConsole()` internally.

```tsx
import { Console, useConsoleMessages } from "@moyarich/console";

export function PageConsole() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "current-page",
    passThrough: true,
  });

  return <Console messages={messages} onClear={clear} />;
}
```

Page capture is off by default. Use the lower-level `capturePageConsole()` utility when you need capture outside React.

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
  createConsoleEventEmitter,
  createConsoleProxy,
} from "@moyarich/console";

const events = createConsoleEventEmitter();
const console = createConsoleProxy({ events });
```

## Fan out console events

A `ConsoleEventEmitter` lets multiple independent consumers observe the same event stream without composing producer callbacks.

```ts
import {
  capturePageConsole,
  CONSOLE_TRANSPORT_TYPE,
  CONSOLE_TRANSPORT_VERSION,
  createConsoleEventEmitter,
  serializeConsoleEvent,
} from "@moyarich/console";

const events = createConsoleEventEmitter();

const stopCapture = capturePageConsole({
  events,
});

const stopSocket = events.onEvent((event) => {
  socket.send(
    JSON.stringify({
      type: CONSOLE_TRANSPORT_TYPE,
      version: CONSOLE_TRANSPORT_VERSION,
      channel: "session-42",
      event: serializeConsoleEvent(event),
    }),
  );
});

const stopAudit = events.onEvent(saveConsoleEvent);
```

Each subscription is independent:

```ts
stopAudit();
stopSocket();
stopCapture();
```

Application code can listen to typed events with `events.on("message", ...)` and `events.on("clear", ...)`. `onEvent()` and `emitEvent()` bridge the discriminated `ConsoleEvent` union used by transports.

## Iframe transport

Inside the iframe, send the console envelope with the browser's native `postMessage()` API:

```ts
import {
  capturePageConsole,
  CONSOLE_TRANSPORT_TYPE,
  CONSOLE_TRANSPORT_VERSION,
  createConsoleEventEmitter,
  serializeConsoleEvent,
} from "@moyarich/console";

const events = createConsoleEventEmitter();

const stopForwarding = events.onEvent((event) => {
  window.parent.postMessage(
    {
      type: CONSOLE_TRANSPORT_TYPE,
      version: CONSOLE_TRANSPORT_VERSION,
      channel: "preview",
      event: serializeConsoleEvent(event),
    },
    "https://host.example.com",
  );
});

const restore = capturePageConsole({
  events,
  source: "iframe",
});
```

In the parent, received transport events publish directly into the channel:

```ts
import {
  createConsoleEventEmitter,
  listenForConsolePostMessages,
} from "@moyarich/console";

const events = createConsoleEventEmitter();

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
  CONSOLE_TRANSPORT_TYPE,
  CONSOLE_TRANSPORT_VERSION,
  createConsoleEventEmitter,
  serializeConsoleEvent,
} from "@moyarich/console";

const socket = new WebSocket("wss://example.com/console");
const events = createConsoleEventEmitter();

const stopSending = events.onEvent((event) => {
  socket.send(
    JSON.stringify({
      type: CONSOLE_TRANSPORT_TYPE,
      version: CONSOLE_TRANSPORT_VERSION,
      channel: "session-42",
      event: serializeConsoleEvent(event),
    }),
  );
});

const restore = capturePageConsole({ events });
```

Receiver:

```ts
import {
  createConsoleEventEmitter,
  listenForConsoleWebSocket,
} from "@moyarich/console";

const events = createConsoleEventEmitter();

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

Values are normalized before transport and restored on receipt. The transport preserves `undefined`, bigint, symbols, function placeholders, `NaN`, infinities, `-0`, errors, dates, regular expressions, maps, sets, ArrayBuffers, typed arrays, DOM elements, and NodeLists. Circular references are represented safely without breaking JSON serialization.

## Development

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run lint
npm run format
npm run format:check
npm run build
npm run storybook
```

## Publishing

`packages/console/package.json` publishes to `https://npm.pkg.github.com` as `@moyarich/console`.

The **Publish GitHub Package** workflow runs when a GitHub Release is published, or manually through `workflow_dispatch`. It uses the repository `GITHUB_TOKEN` with `packages: write`; no npmjs token is required.
