# @moyarich/console-addon-annotations

Bookmark and annotate messages. Annotations use stable message IDs and are stored independently of the source messages. A controller supports custom interfaces.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-annotations react
```

Configure the `@moyarich` scope and authenticate with GitHub Packages as described in the [installation guide](../../../README.md#installation).

Required peer dependencies: `@moyarich/console-core@^0.2.0`, `react@>=18`.

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleAnnotationsAddon } from "@moyarich/console-addon-annotations";

const addons = [createConsoleAnnotationsAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
