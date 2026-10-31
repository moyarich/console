# @moyarich/console-addon-xterm

Render terminal output with xterm.js. Use xterm.js for ANSI/VT terminal rendering, append-only streaming, and terminal-sized scrolling.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-xterm react
```

Configure the `@moyarich` scope and authenticate with GitHub Packages as described in the [installation guide](../../../README.md#installation).

Required peer dependencies: `@moyarich/console-core@^0.2.0`, `@moyarich/console@^0.2.0`, `react@>=18`.

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleXtermAddon } from "@moyarich/console-addon-xterm";

const addons = [createConsoleXtermAddon()];

// Pass your application's terminal output entries to Console.
<Console mode="terminal" messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. Use terminal mode when passing process output.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
