# @moyarich/console-addon-metadata

Display source and timestamps. Show optional source labels and absolute or relative timestamps beside output entries.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-metadata react
```

Configure the `@moyarich` scope and authenticate with GitHub Packages as described in the [installation guide](../../../README.md#installation).

Required peer dependencies: `@moyarich/console-core@^0.2.0`, `react@>=18`.

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleMetadataAddon } from "@moyarich/console-addon-metadata";

const addons = [createConsoleMetadataAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

For localized timestamps, pass a BCP 47 `locale` in the addon options, such as `createConsoleMetadataAddon({ mode: "relative", locale: "pt-BR" })`. Relative timestamps use `Intl.RelativeTimeFormat`; absolute timestamps use the same locale. The `formatTimestamp` option can override the displayed time.

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
