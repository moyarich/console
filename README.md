# @moyarich/console

A React console and ANSI process-output UI for embedded developer tools, browser runtimes, code playgrounds, and other code execution experiences.

Use one component to render structured browser-style `console.*` messages or terminal-style ANSI output. The package also provides console capture, sandbox proxies, event channels, rich-value serialization, iframe/WebSocket transports, and custom renderer hooks.

## Install

`@moyarich/console` is published to GitHub Packages and requires React 18 or newer.

Configure the `@moyarich` scope:

```ini
@moyarich:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Install the package:

```bash
npm install @moyarich/console
```

Import the component and styles:

```tsx
import { Console } from "@moyarich/console";
import "@moyarich/console/styles.css";
```

The package ships ESM and CommonJS builds, TypeScript declarations, and separately exported styles.

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

`Console` also accepts the playground-style `output={{ messages, error }}` shape in structured-console mode.

## Rendering modes

`Console` supports two modes:

| Mode | Input | Use for |
| --- | --- | --- |
| `console` | `ConsoleMessageData[]` or `RunOutput` | Browser-style console messages and rich JavaScript values |
| `ansi` | strings or `ConsoleStdoutEntry[]` | stdout/stderr and ANSI-formatted process output |

### Structured console output

Structured mode is the default:

```tsx
<Console
  messages={[
    {
      method: "log",
      data: ["Hello", { ready: true }],
      depth: 0,
    },
  ]}
/>
```

Structured rendering includes expandable objects, arrays, maps, and sets plus `console.table()`, groups, collapsed groups, traces, timers, counts, assertions, filtering, and custom message/value renderers.

### ANSI process output

Use `mode="ansi"` for terminal-style output:

```tsx
const messages = [
  { id: "1", data: "\u001b[32mServer ready\u001b[0m" },
  {
    id: "2",
    data: "\u001b[31mConnection failed\u001b[0m",
    stream: "stderr",
  },
];

<Console mode="ansi" messages={messages} />;
```

ANSI rendering is powered by `anser` and supports standard/bright colors, 256-color, truecolor, and common text decorations. `stream` is process-channel metadata (`stdout` or `stderr`); it is not mapped to a browser console method.

ANSI mode is a process-output viewer, not a full terminal emulator. Cursor-movement sequences are not emulated.

Set `parseStructuredOutput` to promote a complete strict-JSON object or array into the same expandable value inspector used by structured mode:

```tsx
<Console
  mode="ansi"
  messages={['{"request":{"method":"GET","status":200}}']}
  parseStructuredOutput
/>
```

ANSI escape codes may wrap the JSON because plain text is extracted before `JSON.parse()`. JavaScript-like inspection strings such as `{ name: "Ada" }` remain text because they are not strict JSON.

Use `ConsoleStdout` directly when only the lower-level ANSI output list is needed without the surrounding panel UI.

## Console configuration

The panel keeps runtime-specific controls outside the library. Tabs, restart buttons, runtime selectors, and similar controls should be composed around `Console`.

Common props include:

| Prop | Purpose |
| --- | --- |
| `autoScroll` | Follow new output while the viewer remains near the bottom |
| `resizable` | Enable CSS resizing with `vertical`, `horizontal`, `both`, `block`, or `inline` |
| `showHeader` | Show or hide the panel header |
| `showClearButton` | Include clear in the actions menu when `onClear` is provided |
| `actions` | Add application-defined header actions |
| `title` / `subtitle` | Customize panel heading text |
| `emptyMessage` | Customize the empty state |
| `filter` | Filter structured messages before rendering |
| `onMessagesChange` | Observe the filtered structured message list |
| `messageRenderers` | Extend structured message rendering |
| `valueRenderers` | Extend value rendering in structured and ANSI modes |
| `parseStructuredOutput` | Promote strict JSON in ANSI mode |

Header actions are placed in the native ellipsis popover. ANSI mode also adds a **Copy output** action.

The host layout owns min/max sizing through `style`, `className`, or its surrounding container.

## Message state and capture

### `useConsoleMessages()`

`useConsoleMessages()` manages structured message state and exposes the event channel used internally:

```tsx
const { messages, output, append, clear, events, setMessages } =
  useConsoleMessages({
    maxMessages: 1000,
    dedupeById: true,
    resetKey: sessionId,
  });
```

Messages with the same `id` are deduplicated by default. Changing `resetKey` clears the stream. `maxMessages` defaults to `1000`.

### Capture the current page

Set `capture: true` to capture calls made through a console object. Page capture is disabled by default, and `passThrough` defaults to `true` so captured calls still reach the original console.

```tsx
const { messages, clear } = useConsoleMessages({
  capture: true,
  source: "current-page",
  passThrough: true,
});

<Console messages={messages} onClear={clear} />;
```

Outside React, use `capturePageConsole()` directly:

```ts
const events = createConsoleEventEmitter();

const restore = capturePageConsole({
  events,
  source: "page",
  passThrough: true,
});

// Later
restore();
```

### Capture sandboxed or evaluated code

Use `createConsoleProxy()` when you control the `console` object supplied to the runtime:

```ts
const messages: ConsoleMessageData[] = [];
const runtimeConsole = createConsoleProxy(messages);

runtimeConsole.log("hello", { from: "sandbox" });
runtimeConsole.warn("warning");
```

The proxy can write to an event channel instead of an array:

```ts
const events = createConsoleEventEmitter();
const runtimeConsole = createConsoleProxy({ events, source: "sandbox" });

events.on("message", (message) => {
  // Store, render, or transport the message.
});
```

## Event channel

`createConsoleEventEmitter()` connects producers and consumers without coupling them to React state:

```ts
const events = createConsoleEventEmitter();

const { messages } = useConsoleMessages({ events });
const runtimeConsole = createConsoleProxy({ events });

runtimeConsole.log("shared event stream");
```

Subscribe to `"message"` and `"clear"` directly, or use `onEvent()` / `emitEvent()` with the discriminated `ConsoleEvent` union.

## Custom renderers

Structured messages and values can be extended with ordered renderer tables instead of forking the built-in components.

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
      const metric = value as { label: string; value: number };
      return <strong>{metric.label}: {metric.value}</strong>;
    },
  },
];

<Console
  messages={messages}
  messageRenderers={messageRenderers}
  valueRenderers={valueRenderers}
/>;
```

Renderers are checked in order. A renderer may return `undefined` to continue dispatch. If nothing handles the value, the built-in renderer is used.

Each renderer context exposes `renderDefault()` so custom rendering can wrap or decorate the default output. Synchronous matcher/renderer errors are contained and dispatch continues.

`getConsoleValueType()` exposes the same value type used for renderer dispatch:

- primitives use their normal `typeof` value
- `null` uses `"null"`
- arrays use `"array"`
- objects use their constructor name when available, such as `"Object"` or `"Map"`

Value renderers propagate through nested inspectors, `console.table()` cells, and strict JSON promoted from ANSI output.

## Console methods

Capture and proxy APIs cover:

`log`, `debug`, `info`, `warn`, `error`, `assert`, `dir`, `dirxml`, `table`, `count`, `countReset`, `time`, `timeLog`, `timeEnd`, `timeStamp`, `trace`, `group`, `groupCollapsed`, `groupEnd`, and `clear`.

`countReset()` resets the internal counter without emitting a message. `timeStamp()` is currently a no-op. `dirxml()` is represented as a `dir` message.

## Transport

Console events can cross iframe or WebSocket boundaries using the same versioned, JSON-safe envelope.

### Iframe receiver

```ts
const events = createConsoleEventEmitter();

const stopListening = listenForConsolePostMessages({
  events,
  channel: "preview",
  source: iframe.contentWindow,
  origin: "https://preview.example.com",
});
```

Use specific origins in production rather than `*`.

### WebSocket receiver

```ts
const events = createConsoleEventEmitter();

const stopListening = listenForConsoleWebSocket({
  socket,
  channel: "session-42",
  events,
});
```

### Sending events

`serializeConsoleEvent()` produces a transport-safe event that can be placed in the package envelope:

```ts
const envelope = {
  type: CONSOLE_TRANSPORT_TYPE,
  version: CONSOLE_TRANSPORT_VERSION,
  channel: "preview",
  event: serializeConsoleEvent(event),
};

window.parent.postMessage(envelope, "https://host.example.com");
// or
socket.send(JSON.stringify(envelope));
```

`DEFAULT_CONSOLE_CHANNEL` is `"default"`, and `isConsoleEnvelope()` validates incoming envelopes before they are delivered.

Transport serialization preserves `undefined`, bigint, symbols, function placeholders, special numeric values, errors, dates, regular expressions, maps, sets, ArrayBuffers, DataViews, typed arrays, DOM elements, and NodeLists. Circular references are represented safely.

## Public API

The package root exports the following runtime APIs.

### Components

- `Console`
- `ConsoleMessage`
- `ConsoleStdout`
- `ConsoleValue`
- `ConsoleTable`

### State and capture

- `useConsoleMessages`
- `capturePageConsole`
- `createConsoleProxy`
- `createConsoleEventEmitter`

### Custom rendering

- `getConsoleValueType`
- `ConsoleMessageRenderer` and `ConsoleMessageRendererContext` types
- `ConsoleValueRenderer` and `ConsoleValueRendererContext` types

### Serialization and transport

- `serializeConsoleValue` / `deserializeConsoleValue`
- `serializeConsoleMessage` / `deserializeConsoleMessage`
- `serializeConsoleEvent` / `deserializeConsoleEvent`
- `listenForConsolePostMessages`
- `listenForConsoleWebSocket`
- `CONSOLE_TRANSPORT_TYPE`
- `CONSOLE_TRANSPORT_VERSION`
- `DEFAULT_CONSOLE_CHANNEL`
- `isConsoleEnvelope`

### Utilities

- `CONSOLE_METHODS`
- `normalizeConsoleTableData`
- `formatConsoleObjectForCopy`

The package also exports the corresponding component, hook, transport, serialization, event, and message TypeScript types from `packages/console/src/index.ts`.

## Development

Repository setup, architecture, testing, CI, publishing, and package-maintenance notes are documented in [docs/readme-dev.md](docs/readme-dev.md).

The root `README.md` is the package README source used when publishing `@moyarich/console`.

## License

MIT
