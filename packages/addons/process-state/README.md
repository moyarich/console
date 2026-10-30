# @moyarich/console-addon-process-state

Track terminal process progress. Interpret OSC progress, working directory, command lifecycle, and notifications without requiring xterm.js.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-process-state
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleProcessStateAddon } from "@moyarich/console-addon-process-state";

const addons = [createConsoleProcessStateAddon()];

// Pass your application's terminal output entries to Console.
<Console mode="terminal" messages={messages} addons={addons} />;
```

The addon is optional and can be combined with other Console addons. Use terminal mode when passing process output.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT

## Version compatibility

For the proposed `0.2.0` workspace release, use this addon's `0.2.0` version alongside compatible `0.2.0` Console packages as declared in its [`package.json`](./package.json). See the [`CHANGELOG.md`](./CHANGELOG.md) for release history.
