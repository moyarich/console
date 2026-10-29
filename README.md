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
- [Console lifecycle callback contracts](docs/console-lifecycle.md)

## Packages and addons

Console is a family of independently installable packages. Start with `@moyarich/console`, then add only the capabilities your application needs.

| Package                                        | What it provides                                            |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `@moyarich/console`                            | React console UI for structured messages and process output |
| `@moyarich/console-core`                       | Shared contracts for building and integrating addons        |
| `@moyarich/console-addon-animation`            | Animated process-output display                             |
| `@moyarich/console-addon-annotations`          | Message annotations and labels                              |
| `@moyarich/console-addon-console-feed`         | Console feed integration                                    |
| `@moyarich/console-addon-data-export`          | Export console output data                                  |
| `@moyarich/console-addon-diagnostics`          | Console diagnostics                                         |
| `@moyarich/console-addon-filtering`            | Filter output                                               |
| `@moyarich/console-addon-imperative-scrolling` | Programmatic scrolling and viewport controls                |
| `@moyarich/console-addon-links`                | Detect and interact with links                              |
| `@moyarich/console-addon-markdown`             | Render GitHub Flavored Markdown                             |
| `@moyarich/console-addon-metadata`             | Display message metadata                                    |
| `@moyarich/console-addon-navigation`           | Navigate between messages                                   |
| `@moyarich/console-addon-process-state`        | Represent process execution state                           |
| `@moyarich/console-addon-resizable`            | Resize the console frame                                    |
| `@moyarich/console-addon-search`               | Search console output                                       |
| `@moyarich/console-addon-selection`            | Select messages                                             |
| `@moyarich/console-addon-session`              | Serialize console sessions                                  |
| `@moyarich/console-addon-xterm`                | Render output with xterm.js                                 |

Core console features work without optional addons. Each addon is installed separately. See the [interactive documentation](https://moyarich.github.io/console/) for usage examples and integration guidance.

## License

MIT

## Local development

Run `npm run dev` to start the playground and Storybook together:

- Playground: <http://localhost:5173/>
- Storybook: <http://localhost:5173/storybook/>

Both support hot reload and link to each other. Ctrl+C stops both servers. Storybook runs internally on port 6007; set `DEV_PORT` or `STORYBOOK_DEV_PORT` to change the ports.

Use `npm run dev:playground` or `npm run storybook` to start an individual server. Run `npx playwright test -c playwright.dev.config.ts` to check navigation and live connections through the unified server.
