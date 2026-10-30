# @moyarich/console-addon-persistence

Destination-agnostic persistence for structured console messages and raw terminal entries.

```ts
import { createConsolePersistenceAddon } from "@moyarich/console-addon-persistence";

const addon = createConsolePersistenceAddon({
  adapters: [
    {
      async write(records) {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(records),
        });
      },
    },
  ],
});
```

Pass the addon through `<Console addons={[addon]} />`. The adapter never needs to declare whether its destination is a file, stream, or database. Use `addon.persistence.flush()` before exporting records, and `addon.persistence.close()` at application shutdown.

The headless `createConsolePersistence()` API supports `append()` without a React Console. Records are batched and dispatched in order. A failed batch remains queued for a future retry, and errors can be reported with `onError`.

The component-facing addon subscribes to the Console data snapshot and records new retained messages. For lossless streams, attach the headless pipeline directly to the producer before messages enter a bounded UI history. Protect confidential information by redacting before writing. Local Storybook includes a development-only file endpoint. `File.stories.tsx` appends NDJSON to `logs/persistence/events.ndjson`; `SQLite.stories.tsx` loads and saves a SQLite database at `logs/persistence/console.sqlite`. Both live inside a Git-ignored directory and can survive browser reloads while the Storybook development server remains on the same machine. The endpoint is not part of production builds or hosted static Storybook, where file-backed writes are unavailable. `Memory.stories.tsx` intentionally demonstrates an in-memory adapter only.

## Version compatibility

For the proposed `0.2.0` workspace release, use this addon's `0.2.0` version alongside compatible `0.2.0` Console packages as declared in its [`package.json`](./package.json). See the [`CHANGELOG.md`](./CHANGELOG.md) for release history.
