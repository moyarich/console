# Visualize CSS Colors

Native color swatches and a color picker for **desktop VS Code, VS Code for the
Web, and TypeFox Monaco hosts**. The extension ID is
`moyarich.visualize-css-colors`.

Open a CSS, SCSS, Less, HTML, JavaScript, TypeScript, JSX/TSX, Vue, or Svelte file.
Select a color swatch to inspect or replace its value using the editor's native
picker. Enable `editor.colorDecorators` if swatches are hidden.

## Supported colors

- Hex, named colors, `transparent`, RGB/RGBA, and HSL/HSLA.
- HWB, Lab/LCH, OKLab/OKLCH, and `color()` including Display P3.
- `color-mix()` with weights, transparency, hue interpolation, and nested mixes.
- Relative colors with `calc()`, including `hsl(from red calc(h + 120) s l)`.

A complete function receives one editable color range. Applying a picker edit
replaces that expression with a hex or RGB literal. Advanced colors resolve to
8-bit sRGB; wide-gamut colors can be clipped. The provider inspects source text,
not a rendered DOM: it cannot resolve `var()`, `currentColor`, system colors, or
the active branch of `light-dark()`. Fixed colors inside gradients or
`light-dark()` remain inspectable. See the
[parser documentation](https://github.com/moyarich/console/tree/main/packages/visualize-css-colors/css-color-parser)
for details.

## Build and install

Run these commands from the repository root after `npm ci`:

```sh
npm run build --workspace @moyarich/vscode-visualize-css-colors
npm test --workspace @moyarich/vscode-visualize-css-colors
npm run package --workspace @moyarich/vscode-visualize-css-colors
```

The installable artifact is
`packages/visualize-css-colors/vscode-visualize-css-colors/artifacts/visualize-css-colors-0.1.0.vsix`.
Use **Extensions: Install from VSIX** in a compatible editor, or:

```sh
code --install-extension packages/visualize-css-colors/vscode-visualize-css-colors/artifacts/visualize-css-colors-0.1.0.vsix
```

Browser hosts must support web extensions and loading a VSIX or an extension
registry. Registry availability depends on the host; publishing to Open VSX does
not also publish to the Microsoft Marketplace.

The staged extension in `dist/vscode-extension/` has an unscoped VS Code manifest
with both `main` and `browser` pointing to `dist/extension.cjs`. The CommonJS
bundle contains the parser and `color-bits`; its only external module is the
host's `vscode` API. No Node APIs or DOM globals are used by the provider.
The scoped npm package remains `@moyarich/vscode-visualize-css-colors`, with its
separate ESM/CJS metadata exports for applications. Keep the versions in
`package.json` and `extension.manifest.json` in sync; the build checks this.

## TypeFox Monaco playground

`npm run dev` at the repository root builds the extension and starts the playground.
Open **Additional usage → CSS color decorators**. The example includes computed
mixes, modern color spaces, relative colors, and the limits of context-dependent
expressions. It uses exactly the same provider bundle as the VSIX.

For another TypeFox host, register the extension source:

```ts
import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
import extensionSource from "@moyarich/vscode-visualize-css-colors/extension-source";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";

export const vscodeApiConfig: MonacoVscodeApiConfig = {
  $type: "classic",
  viewsConfig: { $type: "EditorService" },
  userConfiguration: {
    json: JSON.stringify({ "editor.colorDecorators": true }),
  },
  extensions: [
    {
      config: vscodeVisualizeCssColorsManifest,
      filesOrContents: new Map([
        [vscodeVisualizeCssColorsBrowserPath, extensionSource],
      ]),
    },
  ],
  monacoWorkerFactory: configureDefaultWorkerFactory,
};
```

Pass this configuration to `MonacoEditorReactComp`. In Vite set
`worker: { format: "es" }`. Tokenizers, language workers, and themes belong to the
host setup; this extension contributes color information and presentations only.

## Desktop demos

Reusable VS Code development infrastructure is provided by
`@moyarich/vscode-dev-toolkit`. This extension keeps its own scenarios and
configuration in `demo/` and `vscode-dev.config.mjs`; the toolkit owns VS Code
launching, Playwright/CDP integration, recording, codegen conversion, demo UI,
GIF generation, VSIX staging/packaging, development launching, and Open VSX
publishing.

The handwritten scenarios are **basic-colors**, **color-mix**,
**relative-colors**, and **source-colors**.

```sh
node demo/scenarios/basic-colors.mjs
node demo/scenarios/color-mix.mjs --codegen

npm run demo:list --workspace @moyarich/vscode-visualize-css-colors
npm run dev:extension --workspace @moyarich/vscode-visualize-css-colors
npm run demo:record --workspace @moyarich/vscode-visualize-css-colors -- --scenario=color-mix
npm run demo:all --workspace @moyarich/vscode-visualize-css-colors
npm run demo:gif --workspace @moyarich/vscode-visualize-css-colors -- --scenario=color-mix
```

Recording requires a graphical desktop and `ffmpeg` on PATH. The interactive
menu additionally requires `fzf`. Generated scenarios are written to
`demo/scenarios/generated/`; recordings and screenshots go to
`demo/artifacts/<scenario>/`; GIFs go to `media/`.

See [demo/README.md](./demo/README.md) and
[`@moyarich/vscode-dev-toolkit`](../../vscode-dev-toolkit/README.md) for the
scenario contract and shared runtime architecture.

Optional GIF settings are now toolkit-wide:
`VSCODE_DEMO_GIF_FPS`, `VSCODE_DEMO_GIF_WIDTH`, and
`VSCODE_DEMO_GIF_TRIM_START`.

## Publish to Open VSX

Complete the [Open VSX publisher setup](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions):
link the required accounts, accept the publisher agreement yourself, create an
access token, and ensure you can publish under the `moyarich` namespace. Namespace
creation and verified ownership are separate steps.

Export `OVSX_PAT` in your shell without committing it, then run:

```sh
npm run publish:openvsx --workspace @moyarich/vscode-visualize-css-colors
```

This builds and packages the VSIX, then uploads it to Open VSX. The token is read
from the environment and is not placed in command arguments. `.env` is not loaded
automatically. For a new release, bump both manifest versions before packaging;
registry versions cannot be overwritten.

The **Package and publish CSS color extension** GitHub Actions workflow runs
validation and uploads a VSIX artifact by default. To publish, configure the
repository secret `OVSX_PAT` and enable its `publish` input when manually starting
the workflow. The CI workflow also tests and packages the extension on pull requests.
