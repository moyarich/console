# @moyarich/console-addon-filtering

Filter structured Console messages. Filter by message level, source, or text using built-in controls or an observable headless controller.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-filtering
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleFilteringAddon } from "@moyarich/console-addon-filtering";

const addons = [createConsoleFilteringAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
