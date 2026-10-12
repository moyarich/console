# @moyarich/console

A React console toolkit for **capturing, transporting, and rendering runtime output**.

Use it when an application runs code, embeds a preview, connects to a remote runtime, or needs an in-app developer console. It renders browser-style `console.*` messages with inspectable JavaScript values and ANSI-formatted `stdout` / `stderr` from process output.

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

## Install

`@moyarich/console` is published to GitHub Packages and requires React 18 or newer.

```bash
npm install @moyarich/console
```

Import the component:

```tsx
import { Console } from "@moyarich/console";
```

The package ships ESM and CommonJS builds plus TypeScript declarations. Importing `@moyarich/console` loads the core stylesheet automatically.

## Quick start

```tsx
import { Console, useConsoleMessages } from "@moyarich/console";

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

`useConsoleMessages()` owns message state and returns a console-compatible producer. `<Console />` renders the messages, while `onClear={clear}` connects the panel's clear action back to state.

Do not call the returned `console` during React render. Use it from event handlers, runtime callbacks, or effects whose lifecycle you control.

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

## Large retained logs

For thousands of retained messages or process-output entries, enable opt-in windowing:

```tsx
<Console messages={messages} virtualize />
<Console mode="terminal" messages={entries} virtualize />
```

Virtualization limits **mounted React rows**, not retained data. The producer still owns retention, filtering, and disposal. The current virtual viewport uses estimated 32px row heights until measured, with six extra rows on each side of the viewport. Rows can grow when inspectable objects expand, and their heights are measured again after resizing. The host supplies the available height and scroll container; virtualization does not impose a fixed panel height.

Provide stable, unique `id` values when entries may be filtered or reordered. Imperative `scrollToMessage(id, { block: "center" })` works for off-screen retained IDs; an ID excluded by the active filter cannot be scrolled into the current view. Search operates on the data snapshots, not only mounted DOM rows. When virtualization is enabled, built-in terminal copy uses all resolved entries rather than only the mounted viewport. Custom output renderers own their rendering and must implement their own windowing if needed.

The regression suite includes a 10,000-message structured-render test and 10,000- and 100,000-row virtual-range checks. Those tests assert bounded mount ranges; they are **not** browser frame-rate or memory benchmarks. Measure real workloads separately, including expensive decorators, parsers, deeply nested objects, resizing, and continuously appended output.

## Documentation

The playground is the long-form documentation surface for this repository.

It contains two top-level sidebar sections:

- **Examples** — runnable MDX examples grouped by capability.
- **API** — MDX reference pages for rendering modes, message state, console capture/proxy APIs, configuration, viewport controls, addons, theming, extension points, transports, serialization, and the public export surface.

Run it locally:

```bash
npm install
npm run dev
```

Each publishable package owns its concept guides and runnable examples. Keep explanations beside the related examples in `examples/`; keep package overview and API reference pages there too. Repository-level contributor documentation lives under [`docs/04-development`](docs/04-development). The private Vite playground in `apps/playground` aggregates those package docs/examples and repository Development docs for local development and GitHub Pages.

## Packages

This monorepo publishes **19 independently versioned packages**: Console, Console Core, and 17 optional addons. The playground is private and is not published.

| Package                                        | Purpose                                  |
| ---------------------------------------------- | ---------------------------------------- |
| `@moyarich/console`                            | React console and ANSI process-output UI |
| `@moyarich/console-core`                       | Shared addon SDK and runtime contracts   |
| `@moyarich/console-addon-animation`            | Animated process-output display          |
| `@moyarich/console-addon-annotations`          | Message annotations and labels           |
| `@moyarich/console-addon-console-feed`         | Console feed integration                 |
| `@moyarich/console-addon-data-export`          | Data-level output export                 |
| `@moyarich/console-addon-diagnostics`          | Console diagnostics                      |
| `@moyarich/console-addon-filtering`            | Output filtering                         |
| `@moyarich/console-addon-imperative-scrolling` | Imperative viewport controls             |
| `@moyarich/console-addon-links`                | HTTP/HTTPS link detection                |
| `@moyarich/console-addon-markdown`             | GitHub Flavored Markdown rendering       |
| `@moyarich/console-addon-metadata`             | Message metadata                         |
| `@moyarich/console-addon-navigation`           | Message navigation                       |
| `@moyarich/console-addon-process-state`        | Process execution state                  |
| `@moyarich/console-addon-resizable`            | Resizable console frame                  |
| `@moyarich/console-addon-search`               | Search across output                     |
| `@moyarich/console-addon-selection`            | Message selection                        |
| `@moyarich/console-addon-session`              | Session serialization                    |
| `@moyarich/console-addon-xterm`                | xterm.js terminal renderer               |

All packages maintain their own `package.json` version and `CHANGELOG.md`. Core functionality does not require the optional addons. Install only the addons your application needs, and see the package's `examples/` directory for its guides and runnable examples.

## Multi-package release and publishing

Run `npm ci --include=optional`, `npm run checks`, `npm test`, `npm run build:packages`, and `npm run pack:packages` before publishing. CI also builds Storybook and validates the package changelogs and tarballs.

Use the GitHub Actions **Release package** workflow to create a versioned release for a selected package (run with `dry-run: true` first). The **Release Drafter** workflow maintains package-specific drafts using each package's changelog. Release tags use the form `packages/console@0.1.0` or `packages/addons/links@0.1.0` rather than a single repository version.

The **Publish npm package** workflow can select one package or `all` to discover all publishable workspaces. Choose the target registry (`npm`, `github`, or `all`) and verify its `dry-run: true` result before setting `dry-run: false`. The workflow is restricted to `main`, requires appropriate registry credentials, and verifies package tags. Publish dependency packages before their dependents: `@moyarich/console-core` before `@moyarich/console` and core-dependent addons. Do not assume a successful matrix run establishes dependency ordering; confirm the required package versions exist in the destination registry before a live publish-all run.

A release is not the same as publishing: creating a GitHub Release does not automatically upload every package to a registry.

## Scope

`@moyarich/console` is designed to fit inside larger developer tools without taking over runtime orchestration.

It does not provide a JavaScript/Python runtime, shell or PTY, full terminal emulator, server/client tab management, restart/run controls, runtime selection, application routing, or persistence. Those concerns belong to the host application and can be composed around `Console`.

## Development

Repository setup and testing are documented in the [Development section](docs/04-development/page.mdx).

The root `README.md` is the canonical package README used when publishing `@moyarich/console`.

## License

MIT
