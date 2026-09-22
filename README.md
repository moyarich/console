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
| Bundle reusable console extensions                 | `addons` / `ConsoleAddon`                    |
| Make URLs and application references interactive   | `detectLinks` / `linkProviders`              |

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

ANSI mode normalizes common process-output redraw behavior before rendering. A standalone `\r` updates the current logical line instead of creating another permanent row, whether a producer places the carriage return at the end of one chunk (`progress\r`) or at the start of the next redraw chunk (`\rprogress`, as `tqdm` does). `\n` completes the current line, and `\r\n` remains a normal newline. Supported ANSI clear-line sequences apply to the current logical line as well.

This keeps spinner/progress output from build tools, package managers, test runners, and downloads readable without turning the component into a terminal emulator. Completed lines stay stable, and `stdout` / `stderr` metadata remains attached to the visible logical line.

Normalization happens before process-output processors and structured-output parsers, so extensions receive the text that is actually visible instead of stale intermediate progress frames. Ordinary adjacent entries still remain separate rows unless a carriage return, newline boundary, or clear-line control explicitly connects them. Arbitrary cursor positioning and terminal screen/buffer emulation remain intentionally out of scope.

The playground also includes a real-world browser example using Pyodide + `tqdm`. The editable-source runner executes compiled examples as real browser ESM: built-in bare imports such as React and `@moyarich/console` are bridged to ESM module URLs, while absolute browser ESM URLs remain native imports. The example therefore imports Pyodide from `pyodide.mjs` directly and forwards the real `tqdm` formatter's exact carriage-return payloads into ANSI mode.

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
- return `links` using the shared `ConsoleLink` range contract
- observe current ANSI-stripped text through `context.text` without changing output

If a processor changes `data`, link ranges produced for earlier text are discarded because their offsets are no longer valid. A processor that transforms text can return replacement `links` for the new output in the same result. The generic metadata bag remains available for application-specific enrichment that does not yet have a dedicated contract.

For non-React pipelines, `processConsoleOutputEntry(entry, index, processors)` applies the same ordered processor chain directly.

### Interactive links and custom link providers

HTTP and HTTPS URLs are detected by default in both structured console strings and ANSI/process output. Built-in URL detection can be disabled with `detectLinks={false}`.

Use `linkProviders` for application-specific references such as source locations, routes, stack frames, or issue identifiers:

```tsx
import { Console, type ConsoleLinkProvider } from "@moyarich/console";

const sourceLinks: ConsoleLinkProvider = {
  id: "source-location",
  provideLinks(text) {
    const matches = text.matchAll(
      /\\b[\\w./-]+\\.(?:ts|tsx|js|jsx):\\d+(?::\\d+)?\\b/g,
    );

    return Array.from(matches, (match) => ({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      title: "Open source",
      action: ({ link }) => openSource(link.text),
    }));
  },
};

<Console messages={messages} linkProviders={[sourceLinks]} />;
<Console mode="ansi" messages={stdout} linkProviders={[sourceLinks]} />;
```

Each `ConsoleLink` includes the visible `text`, inclusive `start` offset, exclusive `end` offset, and optionally a safe navigation `target`, `title`, or host-defined `action`. Providers run in declaration order before built-in web-link detection, so application-specific ranges take precedence when links overlap.

Navigation targets are restricted to HTTP/HTTPS URLs and same-site relative/hash targets. External web links open with `noopener noreferrer`. Link rendering preserves normal text selection and copy behavior.

ANSI processors can also return `links` using the same `ConsoleLink` contract, which keeps process-output plugins and renderer-level link providers on one metadata model.

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
| `actions`             | Add arbitrary React content to the ellipsis popover                            |
| `panelActions`        | Add descriptor-based actions to the ellipsis popover                           |
| `contextMenuActions`  | Add descriptor-based actions to the right-click context menu                   |
| `title` / `subtitle`  | Customize panel heading text                                                   |
| `emptyMessage`        | Customize the empty state                                                      |
| `className` / `style` | Host-owned layout and styling                                                  |
| `valueRenderers`      | Override rendering for matching values                                         |
| `detectLinks`         | Enable/disable built-in HTTP/HTTPS detection                                   |
| `linkProviders`       | Add ordered application-specific link providers                                |

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
fallback values. A theme can therefore be defined on `:root`, a wrapper
around one console, the `.console-panel` itself, or through the component's
`style` prop.

Do not depend on or override `--_console-*` properties. They are internal and
may change.

### Theme-token naming contract

Public theme token names identify the CSS property they control:

- `*-color` → `color` or an explicitly named color property such as `border-color`
- `*-background-color` → `background-color`
- `*-border` → complete `border` shorthand, such as `1px solid #d0d5dd`
- `*-border-left` / `*-border-bottom` → complete directional border shorthand
- `*-border-color` → `border-color` only
- `*-border-radius` → `border-radius`
- `*-box-shadow` → `box-shadow`
- `*-outline` → complete `outline` shorthand
- typography and sizing tokens use the exact CSS property name

For example, `--console-panel-border` accepts a complete border shorthand,
while `--console-warning-border-color` changes only the warning message's
`border-color`.

### Native `color-scheme` support

| Token | CSS property | Applies to |
| --- | --- | --- |
| `--console-panel-color-scheme` | `color-scheme` | Panel chrome and header actions |
| `--console-color-scheme` | `color-scheme` | Structured/ANSI output surface and, unless overridden, panel chrome |
| `--console-context-menu-color-scheme` | `color-scheme` | Right-click menu |

The panel chrome defaults to light when no scheme is supplied. If
`--console-color-scheme` is set, the panel inherits that scheme unless
`--console-panel-color-scheme` overrides it. Header, control, border, muted,
and heading-icon fallback colors use `light-dark()`, so the header visibly
tracks the selected light/dark scheme without requiring every panel color token
to be overridden.

`color-scheme` also affects browser-rendered UI such as native scrollbars and
controls. Explicit public color tokens still take precedence over the
scheme-derived fallbacks.

### Panel chrome

| Token | CSS property |
| --- | --- |
| `--console-panel-background-color` | `background-color` |
| `--console-panel-color` | `color` |
| `--console-panel-muted-color` | `color` |
| `--console-panel-border` | `border` shorthand |
| `--console-panel-border-radius` | `border-radius` |
| `--console-panel-box-shadow` | `box-shadow` |
| `--console-panel-header-background-color` | `background-color` |
| `--console-panel-header-border-bottom` | `border-bottom` shorthand |
| `--console-panel-popover-box-shadow` | `box-shadow` |

### Panel controls and actions

| Token | CSS property |
| --- | --- |
| `--console-panel-control-background-color` | `background-color` |
| `--console-panel-control-border` | `border` shorthand |
| `--console-panel-control-color` | `color` |
| `--console-panel-control-hover-background-color` | `background-color` |
| `--console-panel-control-hover-color` | `color` |
| `--console-panel-control-hover-border-color` | `border-color` |
| `--console-panel-action-separator-background-color` | `background-color` |

### Output surface and process rows

| Token | CSS property |
| --- | --- |
| `--console-background-color` | `background-color` |
| `--console-color` | `color` |
| `--console-entry-border-bottom` | `border-bottom` shorthand |
| `--console-stderr-border-left` | `border-left` shorthand |
| `--console-clear-line-border-left` | `border-left` shorthand |
| `--console-link-color` | `color` |
| `--console-message-action-focus-outline` | `outline` shorthand |
| `--console-empty-color` | `color` |
| `--console-muted-color` | `color` |
| `--console-subtle-color` | `color` |
| `--console-group-marker-color` | `color` |
| `--console-header-icon-color` | `color` |

### Message states

| Token | CSS property |
| --- | --- |
| `--console-info-color` | `color` |
| `--console-debug-color` | `color` |
| `--console-warning-border-color` | `border-color` |
| `--console-warning-background-color` | `background-color` |
| `--console-warning-color` | `color` |
| `--console-error-border-color` | `border-color` |
| `--console-error-background-color` | `background-color` |
| `--console-error-color` | `color` |

### Values and object inspector

| Token | CSS property |
| --- | --- |
| `--console-string-color` | `color` |
| `--console-number-color` | `color` |
| `--console-null-color` | `color` |
| `--console-symbol-color` | `color` |
| `--console-circular-color` | `color` |
| `--console-property-key-color` | `color` |
| `--console-object-property-key-color` | `color` |
| `--console-object-border-left` | `border-left` shorthand |

### Icons

| Token | CSS property |
| --- | --- |
| `--console-icon-color` | `color` |
| `--console-icon-hover-color` | `color` |
| `--console-icon-hover-background-color` | `background-color` |
| `--console-message-icon-color` | `color` |
| `--console-message-icon-hover-color` | `color` |
| `--console-message-icon-hover-background-color` | `background-color` |

### Tables

| Token | CSS property |
| --- | --- |
| `--console-table-border` | `border` shorthand |
| `--console-table-header-background-color` | `background-color` |
| `--console-table-even-background-color` | `background-color` |

### Context menu

| Token | CSS property |
| --- | --- |
| `--console-context-menu-background-color` | `background-color` |
| `--console-context-menu-border` | `border` shorthand |
| `--console-context-menu-color` | `color` |
| `--console-context-menu-muted-color` | `color` |
| `--console-context-menu-hover-background-color` | `background-color` |
| `--console-context-menu-hover-color` | `color` |
| `--console-context-menu-icon-color` | `color` |
| `--console-context-menu-danger-color` | `color` |
| `--console-context-menu-border-radius` | `border-radius` |
| `--console-context-menu-box-shadow` | `box-shadow` |
| `--console-context-menu-separator-background-color` | `background-color` |

### Typography and sizing

| Token | CSS property |
| --- | --- |
| `--console-font-family` | `font-family` |
| `--console-font-size` | `font-size` |
| `--console-line-height` | `line-height` |
| `--console-min-height` | `min-height` |
| `--console-mobile-min-height` | `min-height` below the package mobile breakpoint |

Derived hover colors use `color-mix()` only as fallbacks. Supplying an
explicit public hover token replaces that derived value.

### Example: light output theme

```css
.my-console-theme {
  --console-panel-color-scheme: light;
  --console-color-scheme: light;
  --console-context-menu-color-scheme: light;

  --console-panel-background-color: #ffffff;
  --console-panel-color: #172033;
  --console-panel-border: 1px solid #d8dee8;
  --console-panel-header-border-bottom: 1px solid #e2e8f0;

  --console-background-color: #f8fafc;
  --console-color: #172033;
  --console-entry-border-bottom: 1px solid #e2e8f0;
  --console-muted-color: #667085;
  --console-subtle-color: #98a2b3;

  --console-string-color: #b42318;
  --console-number-color: #175cd3;
  --console-null-color: #7a5af8;
  --console-symbol-color: #027a48;

  --console-context-menu-background-color: #ffffff;
  --console-context-menu-color: #172033;
  --console-context-menu-border: 1px solid #d8dee8;
  --console-context-menu-separator-background-color: #d8dee8;
}
```

```tsx
<div className="my-console-theme">
  <Console messages={messages} />
</div>
```

The context menu is rendered through a portal to `document.body`. When it
opens, the component copies the public context-menu theme inputs from the
console target into the portaled menu. That preserves wrapper-scoped themes and
allows two consoles with different themes on the same page. Global `:root` or
`body` variables also work.

## Extensible panel, context, and message actions

Use descriptor-based actions when the host application needs commands in the
header ellipsis menu, the console context menu, or on individual structured
messages.

The three typed action surfaces are:

- `panelActions` — panel-level commands in the header ellipsis menu
- `contextMenuActions` — right-click commands for console/object/message targets
- `messageActions` — commands specific to structured messages

The existing `actions` prop remains available as an escape hatch for arbitrary
React content in the header ellipsis popover.

```tsx
import {
  Console,
  type ConsoleContextMenuAction,
  type ConsoleMessageAction,
  type ConsoleMessageData,
  type ConsolePanelAction,
} from "@moyarich/console";

const panelActions: ConsolePanelAction[] = [
  {
    id: "export-output",
    label: "Export output",
    disabled: ({ hasMessages }) => !hasMessages,
    onSelect: ({ mode }) => exportOutput(mode),
  },
];

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
      panelActions={panelActions}
      contextMenuActions={contextMenuActions}
      messageActions={messageActions}
    />
  );
}
```

Each action supports `id`, `label`, `onSelect`, optional `icon`,
`ariaLabel`, `variant`, and `separatorBefore`. Both `visible` and
`disabled` can be booleans or predicates evaluated against the current
action context.

`panelActions` receive the console surface context with `mode` and
`hasMessages`. They render before the built-in ANSI Copy output and Clear
commands.

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

## Addons

Use `addons` when a reusable feature needs to combine several console extension points, shared APIs, or lifecycle resources behind one package-level abstraction.

```tsx
import {
  Console,
  consoleExtensionPoints,
  type ConsoleAddon,
} from "@moyarich/console";

function createBuildAddon(): ConsoleAddon {
  return {
    id: "build-tools",
    activate(host) {
      host.extensions.register(consoleExtensionPoints.linkProvider, {
        id: "build-task-links",
        provideLinks(text) {
          const match = /TASK-\d+/.exec(text);

          if (!match || match.index === undefined) {
            return undefined;
          }

          return [
            {
              text: match[0],
              start: match.index,
              end: match.index + match[0].length,
              action: () => openTask(match[0]),
            },
          ];
        },
      });
    },
  };
}

const buildAddon = createBuildAddon();

<Console messages={messages} addons={[buildAddon]} />;
```

An addon owns **lifecycle and composition**, not a fixed list of feature fields:

```ts
interface ConsoleAddon {
  readonly id: string;
  activate(host: ConsoleAddonHost): ConsoleAddonCleanup;
}
```

The host exposes four generic concepts:

| API                 | Purpose                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `host.extensions`   | Register ordered multi-provider contributions such as processors, parsers, renderers, links, and actions |
| `host.services`     | Publish or consume a typed single-provider API/state service                                             |
| `host.capabilities` | Detect optional functionality without reaching into React or DOM internals                               |
| `host.scope`        | Own listeners, subscriptions, and other disposables for the addon lifetime                               |

### Built-in extension points

`consoleExtensionPoints` currently exposes the package's existing composable hooks:

- `processOutputProcessor`
- `structuredOutputParser`
- `linkProvider`
- `outputRenderer`
- `messageRenderer`
- `valueRenderer`
- `panelAction`
- `contextMenuAction`
- `messageAction`

Direct component props remain supported. When both a direct prop and addon contributions target the same ordered hook, the direct prop entries are placed first so the embedding application retains final control over dispatch precedence.

### Replacing the output surface

`ConsoleStdout` remains the built-in, zero-configuration ANSI/process-output renderer. It is a core default implementation, **not** an addon that applications must install.

The output architecture is symmetric across both modes:

```text
                         Console
                            │
                            ▼
                 outputRenderer extensions
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
   mode: "console"                     mode: "ansi"
          │                                   │
     handled?                            handled?
      │     │                             │     │
     yes    no                           yes    no
      │     │                             │     │
      ▼     ▼                             ▼     ▼
 custom   built-in                    custom  ConsoleStdout
 feed     structured                  terminal   default
 surface  renderer                    surface
```

An addon can replace the complete inner output surface through `consoleExtensionPoints.outputRenderer` while `Console` continues to own the panel frame, title, actions, resize behavior, context menu, addon lifecycle, and surrounding layout.

This means a console-feed-style addon can replace the structured/browser-console surface without introducing another `Console` mode, just as an xterm-style addon can replace the ANSI/process-output surface.

```tsx
function createTerminalSurfaceAddon(): ConsoleAddon {
  return {
    id: "terminal-surface",
    activate(host) {
      host.extensions.register(consoleExtensionPoints.outputRenderer, {
        mode: "ansi",
        render(context) {
          if (context.mode !== "ansi") {
            return undefined;
          }

          return <MyTerminal entries={context.entries} />;
        },
      });
    },
  };
}
```

The same extension point can replace structured console rendering:

```tsx
function createConsoleFeedAddon(): ConsoleAddon {
  return {
    id: "console-feed",
    activate(host) {
      host.extensions.register(consoleExtensionPoints.outputRenderer, {
        mode: "console",
        render(context) {
          if (context.mode !== "console") {
            return undefined;
          }

          return <MyConsoleFeed messages={context.messages} />;
        },
      });
    },
  };
}
```

The discriminated renderer context keeps the source data appropriate to each mode:

- `mode: "console"` receives structured `ConsoleMessageData[]` as `context.messages`
- `mode: "ansi"` receives strings / `ConsoleStdoutEntry[]` as `context.entries`
- both modes receive `renderDefault()` for wrapping or decorating the built-in renderer

Returning `undefined` delegates to the next output renderer and ultimately the built-in surface. Any other React result, including `null`, counts as an intentional replacement.

The renderer context also exposes `renderDefault()`, so an addon can wrap or decorate the built-in surface instead of replacing it completely:

```tsx
host.extensions.register(consoleExtensionPoints.outputRenderer, {
  mode: "ansi",
  render: ({ renderDefault }) => (
    <TerminalShell>{renderDefault()}</TerminalShell>
  ),
});
```

A custom output renderer can still handle an empty source list. This is intentional: terminal implementations such as xterm.js may need to initialize before future process chunks arrive, and structured feed renderers may want to own their own empty state.

The output renderer is implementation-neutral. It can support console-feed-style structured views, alternative terminal engines, virtualized output views, trace views, or other complete output presentations without adding another `Console` mode or feature-specific field to `ConsoleAddon`.

### Custom extension points

Third-party packages can define their own typed extension points without changing `ConsoleAddon`:

```ts
import {
  createConsoleExtensionPoint,
  type ConsoleAddon,
} from "@moyarich/console";

interface DiagnosticProvider {
  analyze(text: string): string | undefined;
}

export const diagnosticProvider =
  createConsoleExtensionPoint<DiagnosticProvider>("acme.diagnosticProvider");

export function createDiagnosticAddon(): ConsoleAddon {
  return {
    id: "acme.diagnostics",
    activate(host) {
      host.extensions.register(
        diagnosticProvider,
        {
          analyze: (text) => (text.includes("ERROR") ? "failure" : undefined),
        },
        {
          id: "default",
          priority: 100,
        },
      );
    },
  };
}
```

Higher extension priorities are returned first. Equal priorities preserve registration order. Registration IDs are optional, but when supplied they must be unique within that extension point.

### Services

Use a service when one addon or core feature publishes an API that another addon consumes:

```ts
import {
  createConsoleServiceToken,
  type ConsoleAddon,
} from "@moyarich/console";

interface BuildService {
  rerun(): void;
}

const buildService = createConsoleServiceToken<BuildService>("acme.build");

const provider: ConsoleAddon = {
  id: "build-provider",
  activate(host) {
    host.services.provide(buildService, {
      rerun: () => runBuild(),
    });
  },
};

const consumer: ConsoleAddon = {
  id: "build-actions",
  activate(host) {
    const build = host.services.require(buildService);

    // Register actions/commands that call build.rerun().
  },
};
```

A service token has one provider at a time. Duplicate providers throw instead of silently replacing the active service.

### Capabilities

The React `Console` host currently advertises:

- `consoleCapabilities.react`
- `consoleCapabilities.dom`
- `consoleCapabilities.structuredMessages` in structured-console mode
- `consoleCapabilities.processOutput` in ANSI/process-output mode

Use capabilities when an addon can adapt to multiple host surfaces:

```ts
if (host.capabilities.has(consoleCapabilities.processOutput)) {
  // Register process-output behavior.
}
```

Future headless/session hosts can expose a different capability set without changing the addon contract.

### Lifecycle and cleanup

Every addon activation receives its own disposable scope. Registrations made through the scoped `host.extensions` and `host.services` registries are removed automatically when the addon unloads.

Use `host.scope` for other resources:

```ts
activate(host) {
  const controller = new AbortController();

  host.scope.defer(() => {
    controller.abort();
  });

  return () => {
    // Optional additional addon cleanup.
  };
}
```

Cleanup is idempotent. When an addon manager is disposed, loaded addons are disposed in reverse activation order.

`<Console addons={...} />` treats the addon list as controlled state. Removing an addon unloads it. Reusing the same addon instance under the same ID keeps it active even if the array container changes. Stateful addons should therefore be created once, for example with `useMemo`, instead of creating a new instance during every render:

```tsx
const addons = useMemo(() => [createBuildAddon()], []);

return <Console messages={messages} addons={addons} />;
```

Duplicate addon IDs are rejected deterministically.

### Headless and advanced hosts

The package also exports the generic factories used by the React integration:

- `createConsoleAddonManager()`
- `createConsoleExtensionPoint()`
- `createConsoleExtensionRegistry()`
- `createConsoleServiceToken()`
- `createConsoleServiceRegistry()`
- `createConsoleCapability()`
- `createConsoleCapabilityRegistry()`
- `createConsoleDisposableScope()`

These contracts intentionally do not expose private component nodes or terminal cursor/buffer concepts. Future data, view, viewport, selection, session, and raw-process stages can be introduced as new services or extension points without adding feature-specific fields to `ConsoleAddon`.

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

### Links

| Export                       | Purpose                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `ConsoleLink`                | Text/range/target/action metadata for one interactive range   |
| `ConsoleLinkProvider`        | Discover application-specific links in rendered text          |
| `ConsoleLinkProviderContext` | Mode/value/process metadata supplied to link providers        |
| `ConsoleLinkActionContext`   | Activated link plus provider/source context                   |
| `detectWebLinks`             | Detect safe HTTP/HTTPS URL ranges                             |
| `resolveConsoleLinks`        | Resolve explicit links, providers, and built-in URL detection |
| `isSafeConsoleLinkTarget`    | Validate navigation targets used by the built-in renderer     |

### Custom rendering

| Export                          | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `getConsoleValueType`           | Resolve the normalized type key used by value-renderer dispatch |
| `ConsoleMessageRenderer`        | Message renderer entry type                                     |
| `ConsoleMessageRendererContext` | Message renderer context type                                   |
| `ConsoleOutputRenderer`         | Complete output-surface renderer entry type                     |
| `ConsoleOutputRendererContext`  | Structured/ANSI context plus built-in `renderDefault()`         |
| `ConsoleValueRenderer`          | Value renderer entry type                                       |
| `ConsoleValueRendererContext`   | Value renderer context type                                     |

### Addons and extension infrastructure

| Export                                            | Purpose                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `ConsoleAddon` / `ConsoleAddonHost`               | Stable lifecycle contract for reusable addons                           |
| `createConsoleAddonManager`                       | Load/dispose addons against shared registries, including headless hosts |
| `consoleExtensionPoints`                          | Built-in processor/parser/link/renderer/action extension points         |
| `createConsoleExtensionPoint`                     | Define a typed third-party multi-provider extension point               |
| `createConsoleServiceToken`                       | Define a typed single-provider service                                  |
| `consoleCapabilities` / `createConsoleCapability` | Discover optional host functionality                                    |
| `createConsoleDisposableScope`                    | Group arbitrary resources under idempotent cleanup                      |

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
