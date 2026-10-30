# @moyarich/console-addon-navigation

Navigate errors and warnings. Jump between visible errors and warnings, or annotated messages when annotations are enabled.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-navigation
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleNavigationAddon } from "@moyarich/console-addon-navigation";

const addons = [createConsoleNavigationAddon()];

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
