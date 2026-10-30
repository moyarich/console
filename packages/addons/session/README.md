# @moyarich/console-addon-session

Save and restore Console sessions. Work with versioned snapshots of structured messages and terminal entries, including dropped-history counts.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-session
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleSessionAddon } from "@moyarich/console-addon-session";

const addons = [createConsoleSessionAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
