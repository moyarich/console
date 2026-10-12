# @moyarich/console-addon-diagnostics

Inspect Console processing through diagnostic reports.

JSON reports covering retained and visible messages, or raw, normalized, and processed terminal output.

## Installation

```bash
npm install @moyarich/console @moyarich/console-addon-diagnostics
```

## Using the addon

The package exports `createConsoleDiagnosticsAddon()`, which creates an optional addon for the Console `addons` prop. Addons can be enabled independently; Console does not require this package to render output.

For runnable examples and available options, see the [package examples](./examples) and the [interactive documentation](https://moyarich.github.io/console/). See the [changelog](./CHANGELOG.md) for version-specific changes.

## Compatibility

Check [package.json](./package.json) for package dependencies and peer requirements.

## License

MIT
