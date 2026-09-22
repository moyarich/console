# @moyarich/console

A React console toolkit for **capturing, transporting, and rendering runtime output**.

Use it when an application runs code, embeds a preview, connects to a remote runtime, or needs an in-app developer console. It can render browser-style `console.*` messages with inspectable JavaScript values or ANSI-formatted `stdout` / `stderr` from a process.

```text
page / sandbox / iframe / remote runtime
                  |
                  v
        console messages or stdout
                  |
        +---------+---------+
        |                   |
        v                   v
 structured console      ANSI output
        |                   |
        +---------+---------+
                  |
                  v
            <Console />
```

Provides utilities for capturing a real `console`, creating a console-compatible proxy for sandboxed code, sharing events, serializing rich JavaScript values, and moving console events across iframe or WebSocket boundaries.

## Choose the API for your use case

| What you need                                      | Start with                                   |
| -------------------------------------------------- | -------------------------------------------- |
| Render `ConsoleMessageData[]` you already have     | `<Console messages={messages} />`            |
| Render ANSI `stdout` / `stderr`                    | `<Console mode="ansi" messages={entries} />` |
| Keep console messages in React state               | `useConsoleMessages()`                       |
| Capture the current page's real `console.*` calls  | `useConsoleMessages({ capture: true })`      |
| Capture a different `Console` object               | `captureConsole()`                           |
| Give evaluated or sandboxed code its own `console` | `createConsoleProxy()`                       |
| Connect producers and consumers without React      | `createConsoleEventEmitter()`                |
| Receive console events from an iframe              | `listenForConsolePostMessages()`             |
| Receive console events from a WebSocket            | `listenForConsoleWebSocket()`                |
| Transform/enrich ANSI process output               | `processors`                                 |
| Parse structured values from ANSI output           | `structuredOutputParsers`                    |
| Customize how messages or values render            | `messageRenderers` / `valueRenderers`        |

## Install

`@moyarich/console` is published to GitHub Packages and requires React 18 or newer.

Install:

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
  const { messages, console, clear } = useConsoleMessages();

  return (
    <>
      <button onClick={() => console.log("Hello", { ready: true })}>
        Add message
      </button>

      <Console messages={messages} onClear={clear} />
    </>
  );
}
```

The important separation is:

- `useConsoleMessages()` owns message state.
- the returned `console` is a console-compatible producer for callbacks and runtime code.
- `append()` remains available when you already have a `ConsoleMessageData`.
- `<Console />` renders the messages.
- `onClear={clear}` connects the panel's clear action back to state.

Do not call the returned `console` during React render. Use it from event handlers, runtime callbacks, or effects whose lifecycle you control.

If your runtime already returns `{ messages, error }`, structured mode also accepts `output={runOutput}`.

## Rendering modes

`Console` has two distinct modes because browser console messages and process output have different semantics.

| Mode      | Input                                 | Best for                                                                  |
| --------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `console` | `ConsoleMessageData[]` or `RunOutput` | Browser-style `console.*`, rich JavaScript values, groups, tables, traces |
| `ansi`    | strings or `ConsoleStdoutEntry[]`     | Process `stdout` / `stderr`, build output, CLI output, ANSI colors        |

### Structured console mode

Structured mode is the default.

```tsx
<Console
  messages={[
    {
      method: "log",
      data: ["Result", { user: { id: 42 }, roles: ["admin"] }],
      depth: 0,
    },
  ]}
/>
```

Values stay structured instead of being flattened to strings. Objects, arrays, Maps, Sets, typed values, errors, and nested data can therefore be inspected in the UI.

Structured mode also understands metadata produced by the proxy, including group depth, table columns, timestamps, sources, and `console.dir()` expansion depth.

### ANSI process-output mode

Use `mode="ansi"` for text written by a process or CLI.

```tsx
const entries = [
  { id: "1", data: "\u001b[32mServer ready\u001b[0m", stream: "stdout" },
  {
    id: "2",
    data: "\u001b[31mConnection failed\u001b[0m",
    stream: "stderr",
  },
];

<Console mode="ansi" messages={entries} />;
```

ANSI rendering uses `anser` and supports standard and bright colors, 256-color, truecolor, and common text decorations.

`stream` is process-channel metadata. A `stderr` entry is **not** converted to `console.error()`.

ANSI mode is intentionally a process-output viewer, not a PTY or VT terminal emulator. It does not emulate cursor movement, shell input, alternate buffers, Vim/tmux behavior, or other terminal state.

#### Carriage-return and progress output

ANSI mode normalizes common process-output redraw behavior before rendering. A standalone `\r` updates the current logical line instead of creating another permanent row, while `\n` completes the current line. `\r\n` remains a normal newline. Supported ANSI clear-line sequences apply to the current logical line as well.

This keeps spinner/progress output from build tools, package managers, test runners, and downloads readable without turning the component into a terminal emulator. Completed lines stay stable, and `stdout` / `stderr` metadata remains attached to the visible logical line.

Normalization happens before process-output processors and structured-output parsers, so extensions receive the text that is actually visible instead of stale intermediate progress frames. Ordinary adjacent entries still remain separate rows unless a carriage return, newline boundary, or clear-line control explicitly connects them. Arbitrary cursor positioning and terminal screen/buffer emulation remain intentionally out of scope.

The playground also includes a real-world browser example using Pyodide + `tqdm`. Pyodide is loaded as an ES module, `tqdm` runs inside Python, and its actual `stderr` progress writes are passed directly into ANSI mode so the carriage-return normalization is exercised by a real third-party progress library rather than synthesized strings.

### Process output with ordered processors

Use `processors` when process output needs runtime-specific normalization or enrichment before rendering. A processor receives immutable output state plus ANSI-stripped text and returns only the fields it wants to change:

```tsx
import type { ConsoleProcessOutputProcessor } from "@moyarich/console";

const processors: ConsoleProcessOutputProcessor[] = [
  {
    id: "normalize-prefix",
    process: (output, context) => ({
      data: context.text.startsWith("[worker] ")
        ? output.data.replace("[worker] ", "")
        : output.data,
      metadata: { runtime: "worker" },
    }),
  },
  {
    id: "promote-task-event",
    process: (output, context) => {
      if (!context.text.startsWith("TASK ")) {
        return undefined;
      }

      return {
        structuredValue: {
          kind: "task",
          message: context.text.slice(5),
          runtime: output.metadata.runtime,
        },
      };
    },
  },
];

<Console mode="ansi" messages={entries} processors={processors} />;
```

Processors run in array order. Each processor sees the successful output and metadata produced by earlier processors. If one throws, its changes are discarded and later processors continue from the last successful state, so a plugin failure cannot suppress the remaining output.

A processor may:

- replace `data` while preserving ANSI rendering for the resulting text
- set `structuredValue` to promote a line into the normal value inspector
- merge host/plugin data into `metadata`
- observe current ANSI-stripped text through `context.text` without changing output

The metadata bag is deliberately extensible. Link, decoration, progress, and richer runtime metadata can be carried by processors without introducing terminal cursor/buffer abstractions; dedicated contracts can be reused as those APIs are added.

For non-React pipelines, `processConsoleOutputEntry(entry, index, processors)` applies the same ordered processor chain directly.

### Parse structured values from ANSI output

If a process prints complete JSON objects or arrays, `parseStructuredOutput` keeps the built-in strict-JSON behavior and renders matching values through the normal expandable inspector:

```tsx
<Console
  mode="ansi"
  messages={['{"request":{"method":"GET","status":200}}']}
  parseStructuredOutput
/>
```

For NDJSON records, compiler diagnostics, test-runner events, or application-specific lines, pass one or more `structuredOutputParsers`:

```tsx
import type { ConsoleStructuredOutputParser } from "@moyarich/console";

const diagnosticParser: ConsoleStructuredOutputParser = (text, context) => {
  const match = text.match(/^ERROR\s+(TS\d+):\s+(.+)$/);

  if (!match) {
    return undefined;
  }

  return {
    kind: "diagnostic",
    code: match[1],
    message: match[2],
    stream: context.stream,
  };
};

<Console
  mode="ansi"
  messages={[
    {
      id: "diagnostic-1",
      data: "\u001b[31mERROR TS2322: invalid value\u001b[0m",
      stream: "stderr",
    },
  ]}
  structuredOutputParsers={[diagnosticParser]}
/>;
```

Parsers run in order and receive ANSI-stripped text plus the original entry context:

```ts
interface ConsoleStructuredOutputParserContext {
  entry: ConsoleStdoutEntry | string;
  index: number;
  id?: string;
  stream?: "stdout" | "stderr";
  metadata?: ConsoleProcessOutputMetadata;
}
```

Processors run before structured parsers, so parsers receive transformed text and accumulated processor metadata. Return `undefined` when a parser does not handle the line. If a parser throws, the console continues to the next parser and ultimately falls back to ANSI text. When `parseStructuredOutput` is also enabled, strict JSON is attempted after custom parsers.

ANSI codes may surround strict JSON because the renderer strips ANSI before calling `JSON.parse()`. JavaScript-like strings such as `{ name: "Ada" }` remain plain text unless a custom parser handles them.

Use `ConsoleStdout` directly if you only need the lower-level ANSI list without the surrounding panel.

## Structured message model

A rendered console message uses this shape:

```ts
interface ConsoleMessageData {
  id?: string;
  method: ConsoleMethod;
  data: unknown[];
  depth: number;
  timestamp?: number;
  source?: string;
  columns?: string[];
  expandLevel?: number;
  showNonenumerable?: boolean;
}
```

| Field               | Meaning                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `method`            | Visual/semantic console method such as `log`, `warn`, `table`, or `trace` |
| `data`              | Original values passed to the console call                                |
| `depth`             | Group nesting level                                                       |
| `id`                | Optional stable identifier used by message state for deduplication        |
| `timestamp`         | Optional message creation time                                            |
| `source`            | Optional producer label such as `page`, `iframe`, or `sandbox`            |
| `columns`           | Optional requested columns for `console.table()`                          |
| `expandLevel`       | Initial object expansion depth, used by `console.dir()`                   |
| `showNonenumerable` | Metadata corresponding to `console.dir(..., { showHidden: true })`        |

## Supported `console.*` methods

`createConsoleProxy()` implements the following console methods. `captureConsole()` wraps the same method set when capturing a real console.

| Console call                 | Message/output behavior                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `log(...data)`               | Emits a `log` message with the original values                                                                         |
| `debug(...data)`             | Emits a `debug` message                                                                                                |
| `info(...data)`              | Emits an `info` message                                                                                                |
| `warn(...data)`              | Emits a `warn` message                                                                                                 |
| `error(...data)`             | Emits an `error` message                                                                                               |
| `assert(condition, ...data)` | Emits `assert` only when the condition is false; defaults to `"Assertion failed"` when no message is supplied          |
| `dir(value, options)`        | Emits one `dir` message and records the requested expansion depth; default depth is 1 and `depth: null` expands deeply |
| `dirxml(...data)`            | Emits a `dir` message with expansion depth 1                                                                           |
| `table(data, columns?)`      | Emits a `table` message and preserves optional requested columns                                                       |
| `count(label?)`              | Increments an internal counter and emits `"label: n"`; label defaults to `"default"`                                   |
| `countReset(label?)`         | Resets the internal counter to 0 and emits no message                                                                  |
| `time(label?)`               | Starts/restarts an internal timer and emits no message                                                                 |
| `timeLog(label?, ...data)`   | Emits a `log` message with elapsed milliseconds plus additional values; emits `warn` if the timer does not exist       |
| `timeEnd(label?)`            | Emits a `timeEnd` message with elapsed milliseconds and removes the timer; emits `warn` if it does not exist           |
| `timeStamp()`                | Currently a no-op                                                                                                      |
| `trace(...data)`             | Emits a `trace` message and appends a generated JavaScript stack trace when available                                  |
| `group(...data)`             | Optionally emits a group header, then increases nesting depth                                                          |
| `groupCollapsed(...data)`    | Same nesting behavior as `group()`, but emits `groupCollapsed` metadata                                                |
| `groupEnd()`                 | Decreases nesting depth without emitting a message                                                                     |
| `clear()`                    | Emits `clear` through the proxy's event channel                                                                        |

If sandboxed code calls an unknown console method on the proxy, the proxy does not throw. It falls back to a `log` message whose first value is `"<method>:"`.

### Example: timers and groups

```ts
const events = createConsoleEventEmitter();
const runtimeConsole = createConsoleProxy({ events });

runtimeConsole.group("build");
runtimeConsole.time("compile");

runtimeConsole.log("Compiling", { files: 42 });
runtimeConsole.timeLog("compile", "after parsing");
runtimeConsole.timeEnd("compile");

runtimeConsole.groupEnd();
```

The messages contain the calculated group depth and timer output, so the renderer does not need to reconstruct console state later.

## Message state with `useConsoleMessages()`

`useConsoleMessages()` is the easiest way to connect event producers to React state.

```tsx
const { messages, output, console, append, clear, events, setMessages } =
  useConsoleMessages({
    maxMessages: 1000,
    dedupeById: true,
    resetKey: sessionId,
  });
```

### Options

| Option            | Default          | Purpose                                                    |
| ----------------- | ---------------- | ---------------------------------------------------------- |
| `initialMessages` | `[]`             | Initial structured messages                                |
| `maxMessages`     | `1000`           | Keeps only the newest messages after the limit is exceeded |
| `dedupeById`      | `true`           | Ignores a new message when its `id` already exists         |
| `resetKey`        | —                | Emits a clear when the value changes                       |
| `events`          | internal emitter | Reuse an existing `ConsoleEventEmitter`                    |
| `capture`         | `false`          | Capture calls from a real console                          |
| `source`          | `"page"`         | Source metadata added during capture                       |
| `passThrough`     | `true`           | Also call the original console method while capturing      |
| `consoleTarget`   | global console   | Existing `Console` object to capture                       |

### Returned values

| Value             | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `messages`        | Current `ConsoleMessageData[]`                          |
| `output`          | Convenience `{ messages, error: "" }` object            |
| `console`         | Stable console-compatible producer backed by hook state |
| `append(message)` | Emits a message into the hook's event channel           |
| `clear()`         | Emits a clear event                                     |
| `events`          | The `ConsoleEventEmitter` used by the hook              |
| `setMessages`     | Direct React state setter for advanced cases            |

## Capture an existing console

### Capture the global console from React

```tsx
const { messages, clear } = useConsoleMessages({
  capture: true,
  source: "current-page",
  passThrough: true,
});

<Console messages={messages} onClear={clear} />;
```

With `passThrough: true`, calls are both captured and forwarded to the original console, so they still appear in browser DevTools.

To capture a different existing `Console` object, provide `consoleTarget`:

```tsx
const { messages, clear } = useConsoleMessages({
  capture: true,
  consoleTarget: iframe.contentWindow.console,
  source: "iframe",
});
```

### Capture outside React

Use `captureConsole()` when you want capture without the state hook.

```ts
const events = createConsoleEventEmitter();

const restore = captureConsole({
  events,
  consoleTarget: previewConsole,
  source: "preview",
  passThrough: true,
});

// later
restore();
```

The returned function restores the original console methods.

## Give sandboxed code a console

`createConsoleProxy()` returns a console-compatible object without patching the page's real console. It publishes `message` and `clear` events into the provided `ConsoleEventEmitter`; storage and rendering stay outside the proxy.

```ts
const events = createConsoleEventEmitter();

const runtimeConsole = createConsoleProxy({
  events,
  source: "sandbox",
});

events.on("message", (message) => {
  // store, render, or transport the message
});

runtimeConsole.log("hello", { from: "sandbox" });
runtimeConsole.warn("warning");
```

### Proxy options

| Option     | Purpose                                                   |
| ---------- | --------------------------------------------------------- |
| `events`   | Event channel that receives `message` / `clear` events    |
| `source`   | Adds source metadata to every emitted message             |
| `now`      | Overrides wall-clock timestamp generation                 |
| `timerNow` | Overrides the high-resolution clock used by timer methods |

## Event channel

`createConsoleEventEmitter()` is a small typed event bus for console producers and consumers.

```ts
const events = createConsoleEventEmitter();

const { messages } = useConsoleMessages({ events });
const runtimeConsole = createConsoleProxy({ events });

runtimeConsole.log("shared event stream");
```

### Event-emitter methods

| Method                      | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `on("message", listener)`   | Subscribe to structured messages; returns an unsubscribe function |
| `on("clear", listener)`     | Subscribe to clear events                                         |
| `off(type, listener)`       | Remove one listener                                               |
| `emit("message", message)`  | Publish one structured message                                    |
| `emit("clear")`             | Publish a clear event                                             |
| `removeAllListeners(type?)` | Remove listeners for one event type or all event types            |

## `Console` component configuration

The component is intentionally a console surface, not a runtime shell. Runtime selectors, restart buttons, server/client tabs, and similar application controls should be composed around it.

### Shared panel props

| Prop                  | Purpose                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| `onClear`             | Callback used by the clear action                                              |
| `autoScroll`          | Follow new output while the viewer remains near the bottom                     |
| `resizable`           | Enables CSS resize with `vertical`, `horizontal`, `both`, `block`, or `inline` |
| `showHeader`          | Show/hide the panel header                                                     |
| `showClearButton`     | Show clear when `onClear` is available                                         |
| `actions`             | Add application-defined actions to the ellipsis popover                        |
| `contextMenuActions`  | Add descriptor-based actions to the right-click context menu                   |
| `title` / `subtitle`  | Customize panel heading text                                                   |
| `emptyMessage`        | Customize the empty state                                                      |
| `className` / `style` | Host-owned layout and styling                                                  |
| `valueRenderers`      | Override rendering for matching values                                         |

The host application owns min/max dimensions. The library only applies the requested CSS resize direction.

### Structured-mode props

| Prop               | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `messages`         | Structured messages to render                         |
| `output`           | Alternative `RunOutput` source                        |
| `error`            | Appends a synthetic `error` message                   |
| `filter`           | Predicate that controls which messages are visible    |
| `onMessagesChange` | Observes the source message list                      |
| `messageRenderers` | Override rendering for matching messages              |
| `messageActions`   | Add actions that receive the selected message context |

### ANSI-mode props

| Prop                      | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `messages`                | Strings or `ConsoleStdoutEntry[]`                             |
| `parseStructuredOutput`   | Promote complete strict-JSON objects/arrays to `ConsoleValue` |
| `structuredOutputParsers` | Parse ANSI-stripped text into application-defined values      |
| `valueRenderers`          | Customize promoted structured values                          |

ANSI mode also adds **Copy output** to the actions menu.

## Theming with CSS custom properties

The package styles expose `--console-*` custom properties as **theme inputs**.
The library does not assign those public properties internally. Instead, it
resolves them through private `--_console-*` implementation tokens with
fallback values. This means a theme can be defined on `:root`, a wrapper
around one console, the `.console-panel` itself, or through the component's
`style` prop without fighting a same-element default declaration.

Do not depend on or override `--_console-*` properties. They are internal and
may change. Override only the public `--console-*` variables.

### Native `color-scheme` support

The console uses the CSS `color-scheme` property for browser-rendered UI such
as scrollbars and native controls. The three public inputs are separate because
the default panel chrome is light while the output surface and context menu are
dark:

| Variable                              | Default                                | Applies to                      |
| ------------------------------------- | -------------------------------------- | ------------------------------- |
| `--console-panel-color-scheme`        | `light`                                | Panel chrome and header actions |
| `--console-color-scheme`              | `dark`                                 | Structured/ANSI output surface  |
| `--console-context-menu-color-scheme` | falls back to `--console-color-scheme` | Right-click menu                |

`color-scheme` tells the browser how to render native UI; it does not
automatically recolor the library's custom surfaces. Set the corresponding
color variables when creating a light or dark theme.

### Common theme variables

| Area              | Variables                                                                                                                                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel chrome      | `--console-panel-background`, `--console-panel-foreground`, `--console-panel-muted`, `--console-panel-border`, `--console-panel-header-background`, `--console-panel-header-border`                                                                                                                                    |
| Panel controls    | `--console-panel-control-background`, `--console-panel-control-border`, `--console-panel-control-foreground`, `--console-panel-control-hover-background`, `--console-panel-control-hover-foreground`, `--console-panel-control-hover-border`                                                                           |
| Output surface    | `--console-background`, `--console-foreground`, `--console-border`, `--console-muted`, `--console-subtle`                                                                                                                                                                                                              |
| Message states    | `--console-info`, `--console-debug`, `--console-warning-background`, `--console-warning-foreground`, `--console-error-background`, `--console-error-foreground`                                                                                                                                                        |
| Values            | `--console-string`, `--console-number`, `--console-null`, `--console-symbol`, `--console-circular`, `--console-property-key`, `--console-object-property-key`                                                                                                                                                          |
| Icons             | `--console-icon-color`, `--console-icon-hover-color`, `--console-icon-hover-background`, `--console-message-icon-color`, `--console-message-icon-hover-color`, `--console-message-icon-hover-background`                                                                                                               |
| Context menu      | `--console-context-menu-background`, `--console-context-menu-foreground`, `--console-context-menu-border`, `--console-context-menu-hover`, `--console-context-menu-hover-foreground`, `--console-context-menu-icon`, `--console-context-menu-danger`, `--console-context-menu-radius`, `--console-context-menu-shadow` |
| Typography/layout | `--console-font-family`, `--console-font-size`, `--console-line-height`, `--console-min-height`, `--console-mobile-min-height`                                                                                                                                                                                         |

Derived hover colors use `color-mix()` only as fallbacks. Supplying an
explicit public hover variable completely replaces the derived value, so themes
do not create circular custom-property dependencies.

### Example: light output theme

```css
.my-console-theme {
  --console-panel-color-scheme: light;
  --console-color-scheme: light;
  --console-context-menu-color-scheme: light;

  --console-panel-background: #ffffff;
  --console-panel-foreground: #172033;
  --console-panel-border: #d8dee8;

  --console-background: #f8fafc;
  --console-foreground: #172033;
  --console-border: #e2e8f0;
  --console-muted: #667085;
  --console-subtle: #98a2b3;

  --console-string: #b42318;
  --console-number: #175cd3;
  --console-null: #7a5af8;
  --console-symbol: #027a48;

  --console-context-menu-background: #ffffff;
  --console-context-menu-foreground: #172033;
  --console-context-menu-border: #d8dee8;
}
```

```tsx
<div className="my-console-theme">
  <Console messages={messages} />
</div>
```

The context menu is rendered through a portal to `document.body`. When it
opens, the component copies explicitly resolved public context-menu theme
variables from the console target into the portaled menu. That preserves
wrapper-scoped themes and allows two consoles with different themes on the same
page. Global `:root` or `body` variables also work.

## Extensible context and message actions

Use descriptor-based actions when the host application needs commands in the
console context menu or on individual structured messages. This is separate
from the `actions` prop, which continues to accept arbitrary React content for
the header ellipsis popover.

```tsx
import {
  Console,
  type ConsoleContextMenuAction,
  type ConsoleMessageAction,
  type ConsoleMessageData,
} from "@moyarich/console";

const contextMenuActions: ConsoleContextMenuAction[] = [
  {
    id: "copy-debug-context",
    label: "Copy debug context",
    visible: ({ kind }) => kind !== "object",
    disabled: ({ hasMessages }) => !hasMessages,
    onSelect: (context) => copyDebugContext(context),
  },
];

const messageActions: ConsoleMessageAction[] = [
  {
    id: "bookmark",
    label: "Bookmark",
    onSelect: ({ message, index }) => bookmarkMessage(message, index),
  },
  {
    id: "open-source",
    label: "Open source",
    disabled: ({ message }) => !message.source,
    onSelect: ({ message }) => openSource(message.source!),
  },
];

export function RuntimeConsole({
  messages,
}: {
  messages: ConsoleMessageData[];
}) {
  return (
    <Console
      messages={messages}
      contextMenuActions={contextMenuActions}
      messageActions={messageActions}
    />
  );
}
```

Each action supports `id`, `label`, `onSelect`, optional `icon`,
`ariaLabel`, `variant`, and `separatorBefore`. Both `visible` and
`disabled` can be booleans or predicates evaluated when the menu opens.

`contextMenuActions` receive a discriminated context with
`kind: "console" | "object" | "message"`. Object contexts include `value`;
message contexts include `message`, its visible `index`, and the visible
`messages` list. `messageActions` always receive the message context and are
available in structured console mode.

Custom actions appear before the built-in copy/clear commands. Enabled menu
items participate in the existing Arrow Up/Down, Home, and End keyboard
navigation. Messages become focusable when custom context or message actions
are configured, so the browser context-menu keyboard command can open the same
action menu.

## Custom message and value renderers

Renderer hooks let an application teach the console about domain-specific values without forking the library.

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

Renderer entries form ordered dispatch tables:

1. `method` or `type` can narrow the candidate.
2. `match` can perform additional matching.
3. `render` returns a React node to handle the value.
4. Returning `undefined` continues to the next renderer.
5. If nothing handles the value, the built-in renderer is used.

Each renderer context exposes `renderDefault()`, which is useful for wrapping or decorating the standard UI. Synchronous matcher/renderer errors are contained so one extension cannot prevent the rest of the console from rendering.

`getConsoleValueType(value)` returns the dispatch type used by value renderers:

- primitives use normal `typeof` names such as `"string"` and `"number"`
- `null` becomes `"null"`
- arrays become `"array"`
- objects use their constructor name when available, for example `"Object"`, `"Map"`, or a custom class name

Value renderers propagate through top-level values, nested inspectors, `console.table()` cells, and structured values promoted from ANSI output.

## Transport console events

The package does not prescribe where code runs. Console events can be moved from an iframe, worker-adjacent bridge, server relay, or remote runtime into the same event channel used by the React UI.

### Envelope

```ts
{
  type: "CONSOLE_PANEL",
  version: 1,
  channel: "preview",
  event: {
    type: "message",
    message: {
      method: "log",
      data: ["hello"],
      depth: 0
    }
  }
}
```

`isConsoleEnvelope()` validates the envelope shape before delivery.

### Receive from `postMessage`

```ts
const events = createConsoleEventEmitter();

const stopListening = listenForConsolePostMessages({
  events,
  channel: "preview",
  source: iframe.contentWindow,
  origin: "https://preview.example.com",
});
```

Use an explicit origin in production. `origin` may also be a `RegExp` or predicate.

### Receive from a WebSocket

```ts
const events = createConsoleEventEmitter();

const stopListening = listenForConsoleWebSocket({
  socket,
  channel: "session-42",
  events,
});
```

The listener accepts JSON text, validates the envelope and channel, deserializes the console event, and publishes it into `events`.

### Send an event

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

`DEFAULT_CONSOLE_CHANNEL` is `"default"`.

## Rich-value serialization

Plain JSON cannot preserve many values that appear in real console output. The serialization helpers preserve or safely represent:

- `undefined`
- bigint
- symbols
- function placeholders
- `NaN`, infinities, and `-0`
- `Error`
- `Date`
- `RegExp`
- `Map` and `Set`
- `ArrayBuffer`, `DataView`, and typed arrays
- HTML elements and NodeLists
- circular references

Available helpers:

| Helper                        | Purpose                                         |
| ----------------------------- | ----------------------------------------------- |
| `serializeConsoleValue()`     | Convert one value to a JSON-safe representation |
| `deserializeConsoleValue()`   | Restore one serialized value                    |
| `serializeConsoleMessage()`   | Serialize every value in a console message      |
| `deserializeConsoleMessage()` | Restore a serialized console message            |
| `serializeConsoleEvent()`     | Serialize a `message` or `clear` event          |
| `deserializeConsoleEvent()`   | Restore a serialized event                      |

`serializeConsoleValue()` also accepts `maxDepth` and `maxEntries` limits so transport payloads can be bounded.

## Public API

### Components

| Export           | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `Console`        | Complete structured-console / ANSI panel |
| `ConsoleMessage` | Render one structured message            |
| `ConsoleValue`   | Render one JavaScript value              |
| `ConsoleTable`   | Render normalized `console.table()` data |
| `ConsoleStdout`  | Lower-level ANSI process-output list     |

### State, capture, and events

| Export                      | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `useConsoleMessages`        | React message state connected to a console event channel |
| `captureConsole`            | Temporarily wrap an existing `Console` object            |
| `createConsoleProxy`        | Create a console-compatible producer for sandboxed code  |
| `createConsoleEventEmitter` | Typed `message` / `clear` event channel                  |

### Structured-output parsing

| Export                                 | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `ConsoleStructuredOutputParser`        | Parse one ANSI-stripped output entry into a value         |
| `ConsoleStructuredOutputParserContext` | Original entry metadata passed to structured-output hooks |

### Custom rendering

| Export                          | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `getConsoleValueType`           | Resolve the normalized type key used by value-renderer dispatch |
| `ConsoleMessageRenderer`        | Message renderer entry type                                     |
| `ConsoleMessageRendererContext` | Message renderer context type                                   |
| `ConsoleValueRenderer`          | Value renderer entry type                                       |
| `ConsoleValueRendererContext`   | Value renderer context type                                     |

### Transport and serialization

| Export                                                  | Purpose                                                  |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `listenForConsolePostMessages`                          | Receive validated console events from `postMessage`      |
| `listenForConsoleWebSocket`                             | Receive validated console events from WebSocket messages |
| `serializeConsoleValue` / `deserializeConsoleValue`     | Round-trip rich values                                   |
| `serializeConsoleMessage` / `deserializeConsoleMessage` | Round-trip structured messages                           |
| `serializeConsoleEvent` / `deserializeConsoleEvent`     | Round-trip console events                                |
| `CONSOLE_TRANSPORT_TYPE`                                | Envelope type, currently `"CONSOLE_PANEL"`               |
| `CONSOLE_TRANSPORT_VERSION`                             | Envelope version, currently `1`                          |
| `DEFAULT_CONSOLE_CHANNEL`                               | Default channel name                                     |
| `isConsoleEnvelope`                                     | Runtime envelope validator                               |

### Utilities

| Export                       | Purpose                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| `CONSOLE_METHODS`            | Message methods understood by structured rendering/transport validation |
| `normalizeConsoleTableData`  | Normalize values for the table renderer                                 |
| `formatConsoleObjectForCopy` | Format inspectable values for copy actions                              |

The package also exports the corresponding component, hook, transport, event, serialization, and message TypeScript types from `packages/console/src/index.ts`.

## What this package intentionally does not do

`@moyarich/console` is designed to fit inside larger developer tools without taking over runtime orchestration.

It does not provide:

- a JavaScript/Python runtime
- a shell or PTY
- a full terminal emulator
- server/client tab management
- restart/run controls
- runtime selection
- application routing or persistence

Those controls belong to the host application and can be composed around `Console`.

## Development

Repository setup, architecture, testing, CI, publishing, and package-maintenance notes are documented in [docs/readme-dev.md](docs/readme-dev.md).

The root `README.md` is the canonical package README used when publishing `@moyarich/console`.

## License

MIT
