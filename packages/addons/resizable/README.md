# @moyarich/console-addon-resizable

Resize the Console panel. Add configurable resize handles, sizing limits, and resize callbacks without changing output behavior.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-resizable
```

## Compatibility

Version 0.2.0 requires `@moyarich/console-core@^0.2.0`. Upgrade the Console host and any directly installed core SDK to compatible 0.2.x versions when upgrading this addon from 0.1.x.

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createResizableConsoleAddon } from "@moyarich/console-addon-resizable";

const addons = [createResizableConsoleAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
