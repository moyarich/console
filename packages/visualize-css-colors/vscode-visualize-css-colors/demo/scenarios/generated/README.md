# Generated scenarios

Playwright Inspector recordings are converted into runnable scenario modules in
this directory.

Generate one from a handwritten scenario:

```bash
node demo/scenarios/color-mix.mjs --codegen
```

Generated `.mjs` files are discovered by `../index.mjs` and use the same
directly executable scenario contract as the handwritten scenarios.
