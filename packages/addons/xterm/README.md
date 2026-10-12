# @moyarich/console-addon-xterm

Render terminal output using xterm.js.

Optional full terminal renderer, append-only streaming, ANSI/VT support, and resize handling.

## Installation

```bash
npm install @moyarich/console @moyarich/console-addon-xterm
```

## Using the addon

The package exports `createConsoleXtermAddon()`, which creates an optional addon for the Console `addons` prop. Addons can be enabled independently; Console does not require this package to render output.

For runnable examples and available options, see the [package examples](./examples) and the [interactive documentation](https://moyarich.github.io/console/). See the [changelog](./CHANGELOG.md) for version-specific changes.

## Compatibility

Check [package.json](./package.json) for package dependencies and peer requirements.

## License

MIT
