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
