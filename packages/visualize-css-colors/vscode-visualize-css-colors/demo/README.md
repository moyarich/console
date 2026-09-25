# Visualize CSS Colors demos

This package keeps only extension-specific demo code. Reusable VS Code demo,
recording, UI, GIF, development-launch, packaging, and publishing infrastructure
lives in `@moyarich/vscode-dev-toolkit`.

## Local structure

```text
demo/
├── dev/
│   └── fixtures/
├── scenarios/
│   ├── generated/
│   ├── basic-colors.mjs
│   ├── color-mix.mjs
│   ├── relative-colors.mjs
│   └── source-colors.mjs
├── dev.mjs
├── gif.mjs
├── interactive.mjs
├── prepare-extension-host.mjs
└── run.mjs
```

`../vscode-dev.config.mjs` connects this extension to the shared toolkit. It
contains the extension ID, staging paths, disposable VS Code settings, launch
arguments, readiness check, codegen preparation, and extension-host setup path.

Each scenario remains self-contained and can be executed directly:

```bash
node demo/scenarios/basic-colors.mjs
node demo/scenarios/color-mix.mjs
```

Capture a new runnable scenario:

```bash
node demo/scenarios/color-mix.mjs --codegen
```

Generated scenarios are written to `demo/scenarios/generated/` and use the
same module contract as handwritten scenarios.
