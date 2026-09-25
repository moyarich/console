# AGENTS.md

## Repository validation rules

After changing a file, format and lint the files you touched before moving on.

### TypeScript / JavaScript files

Run both commands on every changed code file:

```bash
npx --no-install eslint --fix <changed-file>
npx --no-install prettier --write <changed-file>
```

When several code files were changed, pass all of them to the same commands.

### Markdown / MDX, JSON, CSS, HTML, YAML, and other Prettier-supported files

Run Prettier on every changed file, including `.mdx` example pages:

```bash
npx --no-install prettier --write <changed-file>
```

Do not wait for CI to discover formatting problems.

## Before finishing work or opening/updating a pull request

Always run the repository-wide validation commands:

```bash
npm run lint
npm run format:check
```

For implementation changes, also run the relevant typecheck, tests, and build commands. Prefer the full repository checks when practical:

```bash
npm run typecheck
npm test
npm run build
```

A task is not complete while Prettier or ESLint reports errors.

## Editing workflow

1. Make the code or documentation change.
2. Run ESLint with `--fix` on changed TypeScript/JavaScript files.
3. Run Prettier with `--write` on every changed supported file.
4. Re-run tests or typechecks affected by the change.
5. Before the final commit or PR update, run `npm run lint` and `npm run format:check`.
6. Fix failures before declaring the work complete.

Do not rely on pre-commit hooks or CI as the first formatting/linting pass.

## Modern web platform APIs

Prefer modern, standards-based browser primitives over custom JavaScript behavior when they fit the supported browser targets.

- use the native HTML **Popover API** (`popover`, `popovertarget`, and `showPopover()` / `hidePopover()` only when imperative control is actually needed) for transient non-modal overlays
- prefer declarative popover invokers over manually wiring document click listeners, Escape-key handlers, outside-click detection, or ad hoc visibility state
- use **CSS Anchor Positioning** for positioning a popover relative to its invoker when appropriate
- use native `<dialog>` for modal dialogs rather than simulating modal focus/keyboard behavior
- prefer native semantic controls and browser capabilities before introducing a custom abstraction or dependency
- preserve accessibility semantics, keyboard behavior, light-dismiss behavior, and focus handling provided by the platform
- use progressive enhancement when a modern API is optional; do not add a large polyfill or custom framework unless the repository's browser support requires it

Do not use `<details>` merely as a substitute for a menu or floating popover when the Popover API expresses the interaction more accurately.

## Choosing a Console extension point

Prefer the narrowest existing `consoleExtensionPoints.*` contract instead of adding feature-specific branches to the Console host.

```text
processControlParser  raw, stateful process controls before line normalization
processOutputProcessor transformed/enriched logical ANSI output
structuredOutputParser promote terminal text into structured values
linkProvider          application-specific links and link actions
outputRenderer        replace the complete output surface
frameDecorator        structurally wrap the complete Console frame
emptyStateRenderer    customize only an empty output surface
panelElement          persistent addon-owned UI in generic panel slots
messageFilter         structured-message visibility predicates
messageRenderer       replace a structured message row
messageDecoration     additive UI around a structured message row
messageTextProvider   logical searchable/plain text for a message
valueRenderer         customize an individual structured value
keyboardShortcut      keyboard commands scoped to the focused Console
panelAction           Console-level actions
contextMenuAction     context-menu actions
messageAction         actions scoped to one structured message
```

Use `frameDecorator` only when the addon genuinely needs structural wrapping, such as resizing or docking. Search bars, filters, status rows, progress UI, and other persistent controls should normally use `panelElement`.

Use `messageDecoration` for additive row UI such as badges, bookmarks, annotations, search highlights, or gutter markers. Do not replace the whole row with `messageRenderer` merely to add one small visual element.

Use `processControlParser` only for raw stream semantics that must be recognized before line normalization, including stateful control sequences split across chunks. Printable logical-line transformations belong in `processOutputProcessor`.

Use `messageTextProvider` when an addon owns logical text that search/filter/copy/indexing features should be able to discover without changing visible rendering.

## Extension callback contracts

Extension callbacks should receive **one readonly context object** rather than a growing list of positional arguments.

- put the primary subject in the context too: for example `message`, `value`, `text`, or `output`
- prefer `callback(context)` over signatures such as `callback(message, index, messages)` or `callback(output, context)`
- make context fields `readonly`; extension callbacks should treat host state as immutable input
- when an extension needs additional information later, add a field to its context instead of adding another positional parameter
- use the same context shape for `match`, `render`, `process`, or provider callbacks that operate on the same extension contribution
- keep result/patch objects separate from input context objects; parsers and processors return changes rather than mutating `context.output`

Example:

```ts
host.extensions.register(consoleExtensionPoints.messageRenderer, {
  match: ({ message }) => message.method === "error",
  render: ({ message, renderDefault }) => (
    <ErrorBoundary message={message}>{renderDefault()}</ErrorBoundary>
  ),
});
```

Do not introduce compatibility overloads for new extension contracts merely to preserve an older positional callback shape while the addon API is still being established.

## Extension composition and ordering

Every `ConsoleExtensionPoint` declares a `composition` strategy. Do not assume all multi-provider extension points behave like transform plugins.

- `pipeline`: run every contribution sequentially; each stage receives the result produced by preceding stages
- `first-result`: try contributions in order and stop at the first one that handles the input
- `collect`: accumulate all applicable contributions in resolved order
- `all`: every contribution must accept/pass the input; hosts may short-circuit once the outcome is known
- `middleware`: contributions wrap the next/default behavior; earlier resolved contributions form outer wrappers

Extension ordering is deterministic. Higher registration `priority` resolves first; equal priorities preserve registration order. Prefer normal registration order. Use `priority` only when a contribution genuinely must run before or after peers, such as a specialized parser before a generic parser.

For `pipeline` extension points, treat ordering as part of the public behavior. If A transforms output and B runs after A, B must receive A's transformed immutable output, not the original input.

## Addon UI contributions

Addon-owned UI should participate in the same extension system as addon behavior.

- prefer registering UI through an appropriate `consoleExtensionPoints.*` contract instead of requiring the host to mount a sibling component manually
- an addon may register multiple contributions when the feature needs both behavior and UI; for example, filtering can register both `messageFilter` and `panelElement`
- keep host markup generic: do not add feature-specific branches to `<Console>` when an existing extension point can express the UI
- use shared services such as `consoleServices.data` when addon UI needs current Console state instead of requiring duplicate host props
- keep headless usage available when practical, typically with an option that disables the default UI contribution while preserving the behavioral contribution
- direct React components may remain exported for custom layouts, but first-party default UI should be registerable through the addon lifecycle

## Addon dependency guidance

Use the narrowest package surface that fits the addon.

- prefer `@moyarich/console-core` for portable/headless addon contracts
- addons may depend on `@moyarich/console` when they intentionally use React-host-specific APIs
- do not duplicate core contracts merely to avoid a legitimate host dependency
- keep `@moyarich/console-core` independent of `@moyarich/console`

## Workspace addon imports in development

Workspace addon packages publish from their built `dist/` output, but the playground and Storybook are development surfaces and must not require a prebuild before Vite can start.

A common symptom is:

```text
failed to resolve import "@moyarich/console-addon-..." from ".../packages/playground/..."
```

When a first-party addon exists under `packages/addons/` and is already a workspace dependency, this usually means Vite is following the package `exports` to `dist/` before the addon has been built.

For every first-party workspace addon used by the playground or Storybook:

1. Keep published package `exports` pointed at `dist/`.
2. Add the addon to the consuming workspace dependencies.
3. Alias the addon package name to its source entry point in `packages/playground/vite.config.ts`.
4. Add the equivalent source alias in `.storybook/main.ts`.
5. If runnable examples may import the addon, also register it in `compileExampleSource.ts` as a supported runtime module.
6. Keep test and TypeScript path aliases in sync when required.

Example playground alias:

```ts
{
  find: "@moyarich/console-addon-imperative-scrolling",
  replacement: fileURLToPath(
    new URL(
      "../addons/imperative-scrolling/src/index.ts",
      import.meta.url,
    ),
  ),
}
```

Use the equivalent path relative to `.storybook/main.ts` for Storybook. Put specific addon aliases before the general `@moyarich/console` alias.

Do not fix this class of error by weakening runnable-example import validation or by requiring contributors to manually build the addon before `npm run dev`.

Remember that these are separate concerns:

- **Vite source aliasing** lets the playground or Storybook application import an unbuilt workspace addon.
- **Runnable-example runtime registration** lets browser-compiled example source import that addon.

If the runtime registry already supports the addon but Vite reports `failed to resolve import` from `compileExampleSource.ts`, fix the workspace source alias rather than the runtime whitelist.
