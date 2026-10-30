# @moyarich/console-addon-console-feed

Display messages in a feed layout. The feed renderer adds readable severity labels without mutating the input messages. It targets structured Console output.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-console-feed
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleFeedAddon } from "@moyarich/console-addon-console-feed";

const addons = [createConsoleFeedAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
