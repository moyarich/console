# @moyarich/console-addon-metadata

Display source and timestamps. Show optional source labels and absolute or relative timestamps beside output entries.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-metadata
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleMetadataAddon } from "@moyarich/console-addon-metadata";

const addons = [createConsoleMetadataAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
