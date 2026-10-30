# @moyarich/console-addon-resizable

Resize the Console panel. Add configurable resize handles, sizing limits, and resize callbacks without changing output behavior.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-resizable
```

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
