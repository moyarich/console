# @moyarich/console

A React console toolkit for **capturing and displaying runtime output**.

Bring browser-style `console.*` messages, inspectable JavaScript values, and ANSI-formatted process output into your application. Console works well in code playgrounds, developer tools, embedded previews, and applications connected to remote runtimes.

## Features

- **Structured messages:** Render familiar console levels and inspect JavaScript values.
- **Process output:** Display ANSI-formatted `stdout` and `stderr`.
- **Flexible capture:** Work with React state, runtime proxies, iframes, and remote message sources.
- **Customizable UI:** Extend rendering, appearance, and interactions with optional addons.
- **Large logs:** Opt into virtualized rendering when displaying high-volume output.

Console handles presentation and message transport; your application remains in control of runtime execution and lifecycle.

## Installation

```bash
npm install @moyarich/console
```

Requires React 18 or newer. The package includes TypeScript declarations and loads its core stylesheet automatically.

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

Use the console-compatible producer from event handlers or runtime callbacks to add messages, and `<Console />` to display them.

## Explore

**[Interactive playground and documentation](https://moyarich.github.io/console/)** — browse runnable examples, API reference, rendering modes, customization, and addons.

- [Console examples and guides](packages/console/examples/page.mdx)
- [High-volume output accessibility](packages/console/examples/36-high-volume-accessibility/page.mdx)
- [Virtualized output guide](packages/console/examples/38-virtualization/page.mdx)
- [Development documentation](docs/04-development/01-local-development/page.mdx)
- [Release process](docs/04-development/04-release-process/page.mdx)

## Packages and addons

The toolkit includes `@moyarich/console`, shared `@moyarich/console-core` contracts, and optional addons for capabilities such as search, filtering, links, navigation, selection, Markdown, and xterm.js rendering.

Install only the addons you need. Explore the [examples and API documentation](https://moyarich.github.io/console/) for package-specific usage.

## License

MIT
