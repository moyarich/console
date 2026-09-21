# @moyarich/console

A React console and ANSI process-output UI for embedded developer tools, browser runtimes, and code execution experiences.

Render structured browser-style `console.*` messages and terminal-style ANSI output through one component. Capture output from the current page or sandboxed code, inspect rich JavaScript values, and move console events across iframe or WebSocket boundaries.

## Use cases

- embedded developer consoles and debugging panels
- code playgrounds, code runners, and sandboxes
- browser and iframe preview logs
- remote runtime stdout/stderr viewers
- diagnostic, support, and log-inspection tools

## Features

### Rendering and inspection

- structured `console.*` rendering with expandable objects, arrays, maps, and sets
- `console.table()`, groups, collapsed groups, traces, timers, counts, and assertions
- ANSI-aware process output powered by `anser`
- standard/bright ANSI colors, 256-color, truecolor, and text decorations
- optional strict-JSON promotion into the structured object inspector
- smart auto-scroll, filtering, reset, message deduplication, and resizable layouts
- native ellipsis action popover and copy-output support
- ordered custom message/value renderer dispatch with built-in fallback

### Capture and transport

- page-level `console.*` capture
- console proxy for evaluated or sandboxed code
- controlled message state through `useConsoleMessages()`
- event-based message fan-out
- iframe transport through `postMessage`
- WebSocket transport support
- JSON-safe serialization and restoration for rich JavaScript values

### Package

- React 18+ peer support
- TypeScript declarations
- ESM and CommonJS builds
- separately exported package styles

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

`Console` supports smart auto-scroll, filtering, custom actions, optional header controls, and a message-change callback. Header actions are placed behind a native ellipsis popover so they do not compete with the title or subtitle:

```tsx
<Console
  messages={messages}
  onClear={clear}
  filter={(message) => message.method !== "debug"}
  resizable="vertical"
  style={{ minHeight: 240, maxHeight: 720 }}
  autoScroll
  showHeader
  showClearButton
  actions={<button onClick={() => exportLogs(messages)}>Export</button>}
  onMessagesChange={(nextMessages) => saveLogs(nextMessages)}
/>
```

Auto-scroll follows new output while the viewer is near the bottom, but does not pull them away from older messages they are inspecting.

Set `resizable` to a resize direction: `"vertical"`, `"horizontal"`, `"both"`, `"block"`, or `"inline"`. The library does not impose resize-specific min/max dimensions; the host layout owns those through `style`, `className`, or its surrounding layout. The inner output surface flexes with the resized panel, so both structured and ANSI modes remain scrollable.

`useConsoleMessages()` deduplicates repeated messages with the same `id` by default. Set `dedupeById: false` to preserve duplicates. Use `resetKey` to clear the stream when a runtime or session identity changes. Calling `clear()` or receiving a `clear` event empties the message list without adding a marker message:

```tsx
const { messages, clear } = useConsoleMessages({
  resetKey: sessionId,
  dedupeById: true,
});
```

## Custom renderers

Structured console output can be extended with ordered message and value renderer tables. This lets an application render domain-specific messages or values without forking the built-in console components.

`messageRenderers` may dispatch directly by console `method` and/or use a `match` predicate. `valueRenderers` may dispatch by `type` and/or predicate. Value types use `typeof` for primitives, `"null"` for null, `"array"` for arrays, and constructor names such as `"Object"`, `"Map"`, or a custom class name for objects.

```tsx
import {
  Console,
  type ConsoleMessageRenderer,
  type ConsoleValueRenderer,
} from "@moyarich/console";

const messageRenderers: ConsoleMessageRenderer[] = [
  {
    method: "info",
    match: (message) => message.source === "build",
    render: (_message, { renderDefault }) => (
      <div className="build-message">{renderDefault()}</div>
    ),
  },
];

const valueRenderers: ConsoleValueRenderer[] = [
  {
    type: "Object",
    match: (value) =>
      typeof value === "object" &&
      value !== null &&
      "kind" in value &&
      value.kind === "metric",
    render: (value) => {
      const metric = value as {
        kind: "metric";
        label: string;
        value: number;
      };

      return (
        <strong>
          {metric.label}: {metric.value}
        </strong>
      );
    },
  },
];

<Console
  messages={messages}
  messageRenderers={messageRenderers}
  valueRenderers={valueRenderers}
/>;
```

Renderer entries are checked in order. Returning `undefined` opts out and continues to the next renderer, eventually falling back to the built-in renderer. Each renderer context also exposes `renderDefault()`, which is useful when a custom renderer only wants to wrap or decorate the standard output.

Synchronous errors thrown by renderer match/render callbacks are contained and fall back to later/default renderers. Errors thrown later inside a custom React component should be handled by the application's normal React error-boundary strategy.

Value renderers are propagated through nested object inspectors, `console.table()` cells, and strict-JSON values promoted from ANSI output.

## Console modes

`Console` renders one of two message shapes through the same component:

- `mode="console"` (the default) accepts `ConsoleMessageData[]`
- `mode="ansi"` accepts strings or `{ id?, data, stream? }` process-output
  entries and renders ANSI escape sequences with `anser`; `stream` is optional
  and may be `"stdout"` or `"stderr"`

Structured console output:

```tsx
<Console
  mode="console"
  messages={[{ method: "log", data: ["Hello", { ready: true }], depth: 0 }]}
/>
```

ANSI/process output:

```tsx
const messages = [
  { id: "1", data: "\\u001b[32mServer ready\\u001b[0m" },
  {
    id: "2",
    data: "\\u001b[31mConnection failed\\u001b[0m",
    stream: "stderr",
  },
  {
    id: "3",
    data: '{"request":{"method":"GET","status":200}}',
  },
];

<Console mode="ansi" messages={messages} parseStructuredOutput />;
```

Set `parseStructuredOutput` to promote complete strict-JSON object or array
entries into the same expandable inspector used by structured console output.
ANSI codes may wrap the JSON because Anser's plain-text conversion is used
before `JSON.parse()`. JavaScript-like inspection strings such as
`{ name: 'Ada' }` remain terminal text.

The ANSI renderer uses Anser's JSON token output rather than injecting generated
HTML. Supported SGR styling includes standard and bright colors, 256-color and
24-bit truecolor, bold, dim, italic, underline, reverse, hidden, and
strikethrough. Carriage-return metadata is exposed on rendered output.
Cursor-movement sequences are not emulated; ANSI mode is a process-output
viewer, not a full terminal emulator.

`stream` is metadata about the process channel, not a console method. A
`stderr` entry is not treated as `console.error()`.

The ANSI actions menu includes **Copy output**. `ConsoleStdout` remains
available as the lower-level ANSI list renderer when the surrounding Console
panel UI is not needed.

If an application wants tabs, panes, or a restart button, those controls belong
to the application around `Console`.

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
| `Console`                      | Render structured console messages or ANSI stdout by mode       |
| `ConsoleStdout`                | Lower-level ANSI-aware stdout list renderer                     |
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

`getConsoleValueType()` is also exported for consumers that need to resolve the same normalized type key used by custom value-renderer dispatch.

## Development

Repository setup, architecture, testing, CI, and publishing notes are documented in [docs/readme-dev.md](docs/readme-dev.md).

## License

MIT
