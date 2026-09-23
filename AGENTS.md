# AGENTS.md

## Repository validation rules

After changing a file, format and lint the files you touched before moving on.

### TypeScript / JavaScript files

Run both commands on every changed code file:

```bash
npx --no-install eslint --fix <changed-file>
npx --no-install prettier --write <changed-file>
```

When several code files were changed, pass all of them to the same commands.

### Markdown, JSON, CSS, HTML, YAML, and other Prettier-supported files

Run Prettier on every changed file:

```bash
npx --no-install prettier --write <changed-file>
```

Do not wait for CI to discover formatting problems.

## Before finishing work or opening/updating a pull request

Always run the repository-wide validation commands:

```bash
npm run lint
npm run format:check
```

For implementation changes, also run the relevant typecheck, tests, and build commands. Prefer the full repository checks when practical:

```bash
npm run typecheck
npm test
npm run build
```

A task is not complete while Prettier or ESLint reports errors.

## Editing workflow

1. Make the code or documentation change.
2. Run ESLint with `--fix` on changed TypeScript/JavaScript files.
3. Run Prettier with `--write` on every changed supported file.
4. Re-run tests or typechecks affected by the change.
5. Before the final commit or PR update, run `npm run lint` and `npm run format:check`.
6. Fix failures before declaring the work complete.

Do not rely on pre-commit hooks or CI as the first formatting/linting pass.

## Addon dependency guidance

Use the narrowest package surface that fits the addon.

- prefer `@moyarich/console-core` for portable/headless addon contracts
- addons may depend on `@moyarich/console` when they intentionally use React-host-specific APIs
- do not duplicate core contracts merely to avoid a legitimate host dependency
- keep `@moyarich/console-core` independent of `@moyarich/console`

## Workspace addon imports in development

Workspace addon packages publish from their built `dist/` output, but the playground and Storybook are development surfaces and must not require a prebuild before Vite can start.

A common symptom is:

```text
failed to resolve import "@moyarich/console-addon-..." from ".../apps/playground/..."
```

When a first-party addon exists under `packages/addons/` and is already a workspace dependency, this usually means Vite is following the package `exports` to `dist/` before the addon has been built.

For every first-party workspace addon used by the playground or Storybook:

1. Keep published package `exports` pointed at `dist/`.
2. Add the addon to the consuming workspace dependencies.
3. Alias the addon package name to its source entry point in `apps/playground/vite.config.ts`.
4. Add the equivalent source alias in `.storybook/main.ts`.
5. If runnable examples may import the addon, also register it in `compileExampleSource.ts` as a supported runtime module.
6. Keep test and TypeScript path aliases in sync when required.

Example playground alias:

```ts
{
  find: "@moyarich/console-addon-imperative-scrolling",
  replacement: fileURLToPath(
    new URL(
      "../../packages/addons/imperative-scrolling/src/index.ts",
      import.meta.url,
    ),
  ),
}
```

Use the equivalent path relative to `.storybook/main.ts` for Storybook. Put specific addon aliases before the general `@moyarich/console` alias.

Do not fix this class of error by weakening runnable-example import validation or by requiring contributors to manually build the addon before `npm run dev`.

Remember that these are separate concerns:

- **Vite source aliasing** lets the playground or Storybook application import an unbuilt workspace addon.
- **Runnable-example runtime registration** lets browser-compiled example source import that addon.

If the runtime registry already supports the addon but Vite reports `failed to resolve import` from `compileExampleSource.ts`, fix the workspace source alias rather than the runtime whitelist.
