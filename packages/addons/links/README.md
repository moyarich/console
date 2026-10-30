# @moyarich/console-addon-links

Make web URLs interactive. Detect safe HTTP and HTTPS links in structured or terminal output through Console's link-provider extension.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-links
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleLinksAddon } from "@moyarich/console-addon-links";

const addons = [createConsoleLinksAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
