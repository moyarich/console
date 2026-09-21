# @moyarich/console

A reusable React console UI for rendering, capturing, and transporting browser-style console output.

Use it to build embedded developer consoles, playgrounds, code runners, iframe previews, diagnostic panels, and other tools that need structured `console.*` output.

## Features

- React console UI with expandable objects and arrays
- `console.table()` rendering
- groups and collapsed groups
- page-level `console.*` capture
- console proxy for evaluated or sandboxed code
- event-based message fan-out
- iframe transport through `postMessage`
- WebSocket transport support
- JSON-safe serialization for transported values
- controlled message state through `useConsoleMessages()`
- optional stdout view with ANSI terminal rendering
- optional console/stdout tabs and restart action
- smart auto-scroll, filtering, reset, and message deduplication
- rich transport value restoration
- TypeScript types

## Requirements

- React 18 or newer
- React DOM 18 or newer

## Install

`@moyarich/console` is published to GitHub Packages.

Configure the `@moyarich` scope in your project:

```ini
@moyarich:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
npm install @moyarich/console
```

Import the component and styles:

```tsx
import { Console } from "@moyarich/console";
import "@moyarich/console/styles.css";
```

## Quick start

```tsx
import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export function AppConsole() {
  const { messages, append, clear } = useConsoleMessages();

  return (
    <>
      <button
        onClick={() =>
          append({
            method: "log",
            data: ["Hello", { ready: true }],
            depth: 0,
          })
        }
      >
        Add message
      </button>

      <Console messages={messages} onClear={clear} />
    </>
  );
}
```

`Console` can also consume the playground-style `output={{ messages, error }}` shape.

## Console controls

`Console` supports smart auto-scroll, filtering, custom header actions, optional header controls, a message-change callback, and an imperative reset ref:

```tsx
import { useRef } from "react";
import { Console, type ConsoleRef } from "@moyarich/console";

const consoleRef = useRef<ConsoleRef>(null);

<Console
  ref={consoleRef}
  messages={messages}
  onClear={clear}
  filter={(message) => message.method !== "debug"}
  autoScroll
  showHeader
  showClearButton
  actions={<button onClick={() => exportLogs(messages)}>Export</button>}
  onMessagesChange={(nextMessages) => saveLogs(nextMessages)}
/>;

consoleRef.current?.reset();
```

Auto-scroll follows new output while the viewer is near the bottom, but does not pull them away from older messages they are inspecting.

`useConsoleMessages()` deduplicates repeated messages with the same `id` by default. Set `dedupeById: false` to preserve duplicates. Use `resetKey` to clear the stream when a runtime or session identity changes:

```tsx
const { messages, clear } = useConsoleMessages({
  resetKey: sessionId,
  dedupeById: true,
});
```

## Stdout and ANSI output

Pass a `stdout` collection to add a second output view. ANSI SGR color/style sequences are rendered automatically.

```tsx
const stdout = [
  { id: "1", data: "\\u001b[32mServer ready\\u001b[0m" },
  { id: "2", data: "Listening on port 3000" },
];

<Console
  messages={messages}
  stdout={stdout}
  consoleTabLabel="Client"
  stdoutTabLabel="Server"
  onClear={clear}
  onClearStdout={() => setStdout([])}
  onRestart={restartServer}
/>;
```

When `stdout` is provided, the console shows two tabs. The labels are configurable and the views can also be controlled with `view`, `defaultView`, and `onViewChange`.

The restart action is shown in the stdout view when `onRestart` is provided. Restarting also resets both output collections through their clear callbacks.

### Clear marker

To retain a browser-style clear marker instead of leaving message state empty:

```tsx
const { messages, clear } = useConsoleMessages({
  clearMessage: "Console was cleared",
});
```

## Capture the current page

Set `capture: true` to capture calls made through the page's console.

```tsx
import { Console, useConsoleMessages } from "@moyarich/console";
import "@moyarich/console/styles.css";

export function PageConsole() {
  const { messages, clear } = useConsoleMessages({
    capture: true,
    source: "current-page",
    passThrough: true,
  });

  return <Console messages={messages} onClear={clear} />;
}
```

Page capture is disabled by default.

With `passThrough: true`, calls continue to appear in the browser's native DevTools console while also being captured by `@moyarich/console`.

### Capture outside React

Use `capturePageConsole()` directly when a React hook is not appropriate.

```ts
import {
  capturePageConsole,
  createConsoleEventEmitter,
} from "@moyarich/console";

const events = createConsoleEventEmitter();

events.on("message", (message) => {
  console.info("captured:", message);
});

const restore = capturePageConsole({
  events,
  source: "page",
  passThrough: true,
});

// Later:
restore();
```

## Capture evaluated or sandboxed code

Use `createConsoleProxy()` when you control the console object supplied to evaluated code.

### Capture into an array

```ts
import { createConsoleProxy, type ConsoleMessageData } from "@moyarich/console";

const messages: ConsoleMessageData[] = [];
const runtimeConsole = createConsoleProxy(messages);

runtimeConsole.log("hello", { from: "sandbox" });
runtimeConsole.warn("warning");
```

### Capture through an event emitter

```ts
import {
  createConsoleEventEmitter,
  createConsoleProxy,
} from "@moyarich/console";

const events = createConsoleEventEmitter();
const runtimeConsole = createConsoleProxy({ events });

events.on("message", (message) => {
  // Send, store, or render the message.
});

runtimeConsole.log("hello");
```

## Supported console methods

Capture/proxy support includes:

`log`, `debug`, `info`, `warn`, `error`, `assert`, `dir`, `dirxml`, `table`, `count`, `countReset`, `time`, `timeLog`, `timeEnd`, `timeStamp`, `trace`, `group`, `groupCollapsed`, `groupEnd`, and `clear`.

## Event emitter

`createConsoleEventEmitter()` provides a shared event channel for console producers and consumers.

```ts
import { createConsoleEventEmitter } from "@moyarich/console";

const events = createConsoleEventEmitter();

const offMessage = events.on("message", (message) => {
  // Handle one ConsoleMessageData value.
});

const offClear = events.on("clear", () => {
  // Handle console.clear().
});
```

The same emitter can be passed to multiple parts of your application:

```tsx
const events = createConsoleEventEmitter();

const { messages, clear } = useConsoleMessages({ events });

const runtimeConsole = createConsoleProxy({ events });

runtimeConsole.log("shared event stream");
```

For code that works with the discriminated `ConsoleEvent` union, use `events.onEvent(...)` and `events.emitEvent(...)`.

## Iframe transport

Console events can cross iframe boundaries using the browser's native `postMessage()` API.

### Inside the iframe

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

### In the parent page

```ts
import {
  createConsoleEventEmitter,
  listenForConsolePostMessages,
} from "@moyarich/console";

const events = createConsoleEventEmitter();

const stopListening = listenForConsolePostMessages({
  events,
  channel: "preview",
  source: iframe.contentWindow,
  origin: "https://preview.example.com",
});
```

Use specific origins in production rather than `*`.

## WebSocket transport

The transport envelope is JSON-safe, so it can be sent over a WebSocket or relayed by a server without the server understanding the console payload.

### Sender

```ts
import {
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
```

### Receiver

```ts
import {
  createConsoleEventEmitter,
  listenForConsoleWebSocket,
} from "@moyarich/console";

const events = createConsoleEventEmitter();

const stopListening = listenForConsoleWebSocket({
  socket,
  channel: "session-42",
  events,
});
```

## Transport envelope

Transported events use a versioned envelope:

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

A clear operation is represented by:

```ts
{
  type: "clear";
}
```

Values are normalized before transport and restored on receipt. The transport preserves `undefined`, bigint, symbols, function placeholders, `NaN`, infinities, `-0`, errors, dates, regular expressions, maps, sets, ArrayBuffers, typed arrays, DOM elements, and NodeLists. Circular references are represented safely without breaking JSON serialization.

## Main exports

| Export                         | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `Console`                      | Render console messages and optional stdout                     |
| `ConsoleStdout`                | Render ANSI-aware stdout entries                                |
| `parseAnsi`                    | Parse ANSI SGR text into styled segments                        |
| `useConsoleMessages`           | Manage console message state and optional page capture          |
| `capturePageConsole`           | Capture calls from a console object                             |
| `createConsoleProxy`           | Create a console-compatible object for evaluated/sandboxed code |
| `createConsoleEventEmitter`    | Publish and subscribe to message/clear events                   |
| `listenForConsolePostMessages` | Receive console transport events through `postMessage`          |
| `listenForConsoleWebSocket`    | Receive console transport events through a WebSocket            |
| `serializeConsoleEvent`        | Convert an event into a transport-safe representation           |
| `deserializeConsoleEvent`      | Restore transported console values on receipt                   |
| `CONSOLE_TRANSPORT_TYPE`       | Transport envelope type                                         |
| `CONSOLE_TRANSPORT_VERSION`    | Transport protocol version                                      |

## Development

Repository setup, architecture, testing, CI, and publishing notes are documented in [docs/readme-dev.md](docs/readme-dev.md).

## License

MIT
