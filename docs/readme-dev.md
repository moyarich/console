# @moyarich/console development guide

This document is for contributors and maintainers working on the `moyarich/console` repository.

Package usage belongs in the root [README.md](../README.md). **The root `./README.md` is the single source of truth for the published package README. Do not maintain a separate `packages/console/README.md`.**

## Repository structure

```text
apps/
  playground/          Interactive examples and manual testing
packages/
  console/             Published @moyarich/console package
stories/               Storybook stories
tests/                 Unit, rendering, proxy, and transport tests
docs/                  Maintainer/development documentation
.github/workflows/     CI and publishing workflows
```

The public package entry point is:

```text
packages/console/src/index.ts
```

Keep exports intentional. New public APIs should be exported there and documented in the root README when they are user-facing.

## Requirements

The workspace requires:

```text
Node ^22.13.0 or >=24
npm
```

CI currently runs on Node 24.

## Install

Here’s a cleaner version with the token name corrected and the steps made clearer:

### Install from GitHub Packages

Configure the `@moyarich` scope in a project-level `.npmrc` file:

```ini
registry=https://registry.npmjs.org/

@moyarich:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set `GITHUB_TOKEN` in your environment to a GitHub token with permission to read packages.

Then install dependencies from the repository root:

```bash
npm install
```

CI installs optional dependencies explicitly:

```bash
npm install --include=optional
```

## Common commands

| Command                    | Purpose                               |
| -------------------------- | ------------------------------------- |
| `npm run dev`              | Run the playground                    |
| `npm test`                 | Run the Vitest suite once             |
| `npm run test:watch`       | Run Vitest in watch mode              |
| `npm run typecheck`        | Typecheck workspaces and tests        |
| `npm run lint`             | Run ESLint with zero warnings allowed |
| `npm run lint:fix`         | Run ESLint with automatic fixes       |
| `npm run format`           | Format the repository with Prettier   |
| `npm run format:check`     | Verify Prettier formatting            |
| `npm run build`            | Build the package and playground      |
| `npm run build:package`    | Build only `@moyarich/console`        |
| `npm run build:playground` | Build only the playground             |
| `npm run storybook`        | Run Storybook on port 6006            |
| `npm run build-storybook`  | Build static Storybook output         |

## Package architecture

The package is intentionally split into a few responsibilities.

### Rendering

`Console` has two rendering modes:

- `mode="console"` renders normalized `ConsoleMessageData` values
- `mode="ansi"` renders process-output entries with ANSI styling through `anser`

`ConsoleStdout` is the lower-level ANSI list renderer used when the surrounding console panel UI is not needed. ANSI mode is a process-output viewer, not a terminal emulator; application-specific shells, tabs, restart controls, and runtime orchestration belong outside the package.

Key files include:

```text
packages/console/src/components/Console.tsx
packages/console/src/components/ConsoleStdout.tsx
packages/console/src/components/ConsoleMessage.tsx
packages/console/src/components/ConsoleValue.tsx
packages/console/src/components/ConsoleTable.tsx
```

Structured rendering should not need to know whether a message came from page capture, a sandbox, an iframe, or a WebSocket. Process-channel metadata such as stdout/stderr should remain distinct from browser console methods.

### Custom renderer dispatch

Custom message and value rendering is implemented as ordered dispatch tables in `packages/console/src/renderers.ts`.

- message entries can dispatch by `method`, `match`, or both
- value entries can dispatch by normalized `type`, `match`, or both
- entries are evaluated in array order
- returning `undefined` continues dispatch and eventually falls back to the built-in renderer
- `renderDefault()` lets a custom renderer decorate the built-in result without reimplementing it
- synchronous matcher/renderer errors are contained so extension code does not prevent console rendering

Keep renderer dispatch data-oriented. Avoid growing method/type handling into large conditionals or switches when a lookup/dispatch table is clearer.

Value renderers must continue to propagate through nested `ConsoleValue` instances, `console.table()` cells, and structured ANSI values.

### Message state

`useConsoleMessages()` owns the common React state flow.

It can:

- maintain a bounded message list
- append messages
- clear messages
- subscribe to a provided `ConsoleEventEmitter`
- create an internal emitter when one is not supplied
- optionally start and clean up page capture

The emitter is deliberately separate from React state so non-React producers and consumers can use the same event stream.

### Event flow

The central event abstraction is `createConsoleEventEmitter()`.

It handles two logical events:

```text
message -> ConsoleMessageData
clear   -> no payload
```

It also supports the discriminated transport-facing form:

```ts
type ConsoleEvent =
  { type: "message"; message: ConsoleMessageData } | { type: "clear" };
```

Typical flow:

```text
producer
  |
  |  ConsoleEvent
  v
ConsoleEventEmitter
  |
  +--> useConsoleMessages() --> React state --> <Console />
  |
  +--> transport sender
  |
  +--> audit/debug subscriber
```

A producer should publish to the event emitter rather than requiring callback composition from every consumer.

### Producers

Current producers include:

- `capturePageConsole()`
- `createConsoleProxy()`
- `listenForConsolePostMessages()`
- `listenForConsoleWebSocket()`
- application code calling `events.emit(...)` or `events.dispatch(...)`

### Page capture

`capturePageConsole()` wraps methods on a target console and returns a cleanup function that restores the previous methods.

Important behavior:

- capture must be reversible
- `passThrough` controls whether the original console method is also invoked
- group depth must remain consistent
- timer/count state belongs to the capture/proxy instance
- cleanup must not leak patched console methods

### Console proxy

`createConsoleProxy()` provides a console-compatible object for runtimes where application code should not write directly to the host console.

`createConsoleProxy()` reports `ConsoleEvent` values through its `onEvent` callback. Storage and transport remain the caller's responsibility.

Keep browser-like behaviors such as groups, counts, timers, assertions, tables, and traces inside the proxy/capture layer rather than the React renderer.

### Transport

Transport helpers use a versioned JSON-safe envelope.

```text
ConsoleEvent
  |
serializeConsoleEvent()
  |
ConsoleTransportEnvelope
  |
postMessage / WebSocket / relay
  |
isConsoleEnvelope()
  |
ConsoleEventEmitter.dispatch()
```

The transport protocol should remain independent of the React UI.

When changing the transport shape:

1. update the version if the change is incompatible
2. keep validation strict
3. update serialization tests
4. update postMessage/WebSocket tests
5. update the public README

### Serialization

Serialization protects transport boundaries from values JSON cannot represent safely.

Regression coverage should include:

- `BigInt` and `undefined`
- functions and symbols
- `NaN`, infinities, and negative zero
- errors, dates, and regular expressions
- maps and sets
- ArrayBuffers, DataViews, and typed arrays
- DOM elements and NodeLists
- circular references
- repeated non-circular references
- objects with throwing getters/string conversion
- serialize/deserialize round trips across postMessage and WebSocket listeners

## Console methods

The capture registry lives in:

```text
packages/console/src/consoleMethods.ts
```

When adding or changing a console method:

1. update the registry
2. decide whether it directly maps to a rendered message method
3. implement any method-specific state/behavior in the capture/proxy layer
4. add or update tests
5. add a playground example when the behavior benefits from interactive verification
6. update the user-facing supported-method list when applicable

## Playground

The playground is the primary interactive development surface.

```bash
npm run dev
```

Examples use numbered directories as the source of truth for grouping and order:

```text
apps/playground/src/examples/
  00-ansi/
    01-terminal/
      example.tsx
      index.tsx
      meta.json
    02-typescript-compile-error/
      ...
  05-console-methods/
    01-console-log/
      ...
    13-console-group-collapsed/
      ...
  30-transports/
    01-iframe/
      ...
  40-events/
    01-console-event/
      ...
  50-additional-usage/
    07-plain-messages/
      ...
```

The numeric prefix on a group directory controls group order. The numeric prefix on an example directory controls order within that group. The suffix after the prefix becomes the runtime `groupId` or example `id`. Group display labels are derived from the group ID with `change-case` `sentenceCase()`.

`meta.json` contains display metadata only:

```json
{
  "label": "console.log",
  "description": "Capture and render a standard console.log message."
}
```

The examples index auto-discovers `NN-group/NN-example` directories, so examples do not need manual registration and ordering must not be duplicated in metadata.

When adding or reordering an example:

1. place it under the appropriate numbered group directory
2. use an `NN-example-name` directory prefix for its order
3. include `example.tsx`, `index.tsx`, and `meta.json`
4. change numeric prefixes to reorder groups or examples
5. keep example code representative of the public package API
6. avoid depending on private implementation details

Renaming only a numeric prefix changes order without changing the example `id`. Changing the suffix changes the derived `id`, so suffixes should remain stable unless an ID change is intentional.

## Storybook

Use Storybook for isolated component states:

```bash
npm run storybook
```

Build it before merging changes that affect stories:

```bash
npm run build-storybook
```

## Tests

The repository uses Vitest.

Run everything:

```bash
npm test
```

Useful test areas include:

- event emitter behavior and unsubscribe semantics
- console proxy behavior
- group depth
- timers and counts
- transport validation
- serialization edge cases
- table normalization
- server-rendered console markup

Prefer regression tests when fixing a bug.

## Formatting and linting

The repository includes a tracked pre-commit hook backed by `lint-staged`. Hook installation is explicit so `npm install` does not silently change a contributor's Git configuration.

After installing dependencies, enable the tracked hooks once:

```bash
npm run hooks:install
```

The pre-commit hook runs only against staged files:

- Prettier formats supported staged source, config, style, and documentation files
- ESLint runs with `--fix` on staged JavaScript and TypeScript files
- `lint-staged` protects partially staged files while tasks modify the working tree
- files fixed by the tools are included in the staged result
- the commit is blocked when a task still fails

The hook is intentionally limited to fast staged-file formatting and linting. The full repository validation remains CI's responsibility. Typechecking, tests, builds, Storybook, and package validation do not run in pre-commit.

If the local hook must be bypassed once:

```bash
git commit --no-verify
```

CI still enforces the repository checks before merge.

Before committing documentation or code changes:

```bash
npm run format
npm run lint
npm run typecheck
npm test
```

To verify formatting without modifying files:

```bash
npm run format:check
```

## CI

The CI workflow validates pull requests and `main`.

Current validation order:

```text
npm install --include=optional
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm run build-storybook
npm pack --workspace @moyarich/console --dry-run
```

A change should be considered ready only when the same checks pass locally or in CI.

## Package build

The published package is:

```text
packages/console
```

It builds ESM, CommonJS, and TypeScript declarations with React and React DOM externalized.

Package styles are exported separately as:

```ts
import "@moyarich/console/styles.css";
```

React and React DOM are peer dependencies and currently require version 18 or newer.

## Package metadata

Keep the public metadata in `packages/console/package.json` aligned with the actual library surface.

When capabilities change, review:

- `description` for a concise statement of the package's current purpose
- `keywords` for relevant discovery terms without claiming unsupported behavior
- `repository`, `bugs`, and `homepage` links
- the root README, which is copied into the package during `npm pack` / `npm publish`

The package should describe ANSI support as process-output rendering rather than as a full terminal emulator.

## Publishing

`packages/console/package.json` publishes `@moyarich/console` to:

```text
https://npm.pkg.github.com
```

The repository's GitHub Packages publishing workflow is responsible for release publication.

Before publishing:

1. verify the package version
2. run the full CI-equivalent validation set
3. inspect the package contents with `npm pack --workspace @moyarich/console --dry-run`
4. make sure new public APIs are exported from `packages/console/src/index.ts`
5. update the root `./README.md` for externally visible behavior; it is the published package README source of truth

## Pull request checklist

Before opening or merging a PR:

- public behavior is documented
- implementation-only details stay out of the user README
- tests cover new behavior and regressions
- `npm run lint` passes
- `npm run format:check` passes
- `npm run typecheck` passes
- `npm test` passes
- `npm run build` passes
- Storybook builds when component stories are affected
- package archive contents remain correct
