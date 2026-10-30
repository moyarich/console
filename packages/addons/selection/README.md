# @moyarich/console-addon-selection

Select Console messages. Select message IDs individually or in visible ranges, with optional message actions and decorations.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-selection
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleSelectionAddon } from "@moyarich/console-addon-selection";

const addons = [createConsoleSelectionAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
