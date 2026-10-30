# @moyarich/console-addon-search

Search and highlight output. Find text matches, move between occurrences, and use optional controls and an observable controller.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-search
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleSearchAddon } from "@moyarich/console-addon-search";

const addons = [createConsoleSearchAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT

## Version compatibility

For the proposed `0.2.0` workspace release, use this addon's `0.2.0` version alongside compatible `0.2.0` Console packages as declared in its [`package.json`](./package.json). See the [`CHANGELOG.md`](./CHANGELOG.md) for release history.
