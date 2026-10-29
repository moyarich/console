# Console lifecycle contracts

Lifecycle callbacks observe **committed React effects**, not construction or render. They are per mounted Console instance; event emitters and addon managers are not global.

| Callback | Behavior |
| --- | --- |
| `onMount(handle)` | Runs on effect setup, returns optional cleanup invoked on effect cleanup; changing the handler does not remount. |
| `onMessagesChange(messages)` | Structured mode only: first committed source array and subsequent source-reference replacements, excluding synthetic errors and presentation-only changes. |
| `onOutputChange(entries)` | Terminal mode only: first raw input and later source-reference replacements, before ANSI parsing. |
| `onModeChange(next, previous)` | Runs for committed mode changes, not on initial mount. The new mode's child snapshot effect has already run. |
| `onAddonsReady({mode,addonIds})` | Successful synchronous addon reconciliation, including an initially empty set; changes in enabled instances or manager mode cause a new generation. |
| `onAddonError(error,addonId,phase)` | Synchronous activation/disposal failure; `phase` is `activate` or `dispose`. |
| `onReady({handle,mode,snapshot})` | Successful synchronous addon generation with currently published logical snapshot. Ordinary message updates do not create new ready generations. |
| `onError(error,{phase,addonId?})` | Caught synchronous Console-managed errors; phases: `mount`, `ready`, `addon-activate`, `addon-dispose`, `callback`. |

**Ordering:** The mode-specific child publishes a logical snapshot in its effect before parent mode/addon notifications. On a successful addon generation, `onAddonsReady` runs before `onReady`. The two error observers receive addon activation/disposal failures independently. Callback identity replacement should not replay lifecycle notifications.

**React Strict Mode:** development effect setup → cleanup → setup may invoke `onMount` and addon generations more than once. Consumers must provide idempotent subscriptions and cleanup; no global exactly-once guarantee exists. A genuine unmount/remount is likewise a new lifecycle.

**Failure boundaries:** synchronous addon activation errors suppress readiness for that generation; other addons continue loading. Disposal failures do not stop remaining cleanup. Lifecycle observer exceptions are contained to avoid recursive reporting. `onError` is *not* a React error boundary and cannot observe arbitrary render exceptions or unhandled asynchronous failures.

**Persistence:** `onReady` means Console's synchronous addon reconciliation finished, **not** that network connections, files, IndexedDB, SQLite/WASM, fonts, or server-side storage have initialized. Gate external initialization explicitly before enabling writes:

```tsx
const [databaseReady, setDatabaseReady] = useState(false);
useEffect(() => {
  let active = true;
  void initializeDatabase().then(() => {
    if (active) setDatabaseReady(true);
  });
  return () => { active = false; };
}, []);

return databaseReady
  ? <Console messages={messages} addons={[persistenceAddon]} onReady={({ snapshot }) => {
      console.info("Console ready", snapshot.mode);
    }} />
  : <p>Initializing database…</p>;
```

See `stories/console/lifecycle/` and `tests/storybook/*lifecycle.spec.ts` for runnable contracts. TypeScript types for `ConsoleHandle`, `ConsoleMode`, `ConsoleProps` and `ConsoleDataSnapshot` are exported by `@moyarich/console`.
