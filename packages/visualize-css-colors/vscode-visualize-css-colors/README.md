# @moyarich/vscode-visualize-css-colors

A browser-compatible VS Code extension that exposes CSS colors through the native
`DocumentColorProvider` API.

```text
@moyarich/css-color-parser
        ↓
@moyarich/vscode-visualize-css-colors
        ↓
VS Code / monaco-vscode color decorators
```

The extension does not paint Monaco decorations itself. It returns
`ColorInformation` and `ColorPresentation` values so the VS Code-compatible editor
runtime owns the color swatch, color picker, refresh lifecycle, and editor settings.

## @typefox/monaco-editor-react

Build the package first, then register the web extension in the VS Code API
configuration used by the TypeFox editor host.

```ts
import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
import extensionSource from "@moyarich/vscode-visualize-css-colors/extension-source";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";

const filesOrContents = new Map<string, string | URL>([
  [vscodeVisualizeCssColorsBrowserPath, extensionSource],
]);

export const vscodeApiConfig: MonacoVscodeApiConfig = {
  $type: "extended",
  viewsConfig: {
    $type: "EditorService",
  },
  userConfiguration: {
    json: JSON.stringify({
      "editor.colorDecorators": true,
    }),
  },
  extensions: [
    {
      config: vscodeVisualizeCssColorsManifest,
      filesOrContents,
    },
  ],
  monacoWorkerFactory: configureDefaultWorkerFactory,
};
```

Pass that configuration to `MonacoEditorReactComp`:

```tsx
import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";

<MonacoEditorReactComp
  vscodeApiConfig={vscodeApiConfig}
  editorAppConfig={editorAppConfig}
/>;
```

For Vite production builds, configure Monaco/VS Code workers as ES modules:

```ts
export default defineConfig({
  worker: {
    format: "es",
  },
});
```

The extension is registered as a real VS Code web extension. The host loads its
`browser` entry point and activates it through the extension lifecycle, while the
extension registers its `DocumentColorProvider` through the `vscode` API.

The executable extension bundle is CommonJS because the VS Code web extension host
expects a bundled extension module rather than application ESM. The package also
generates the typed `extension-source` export so browser hosts can register that
bundle without bundler-specific asset import syntax. The extension imports only the
`vscode` API and the parser package; it does not use Node-only APIs.

## CSS color functions

The provider supports the parser's absolute and relative color functions, including
`color-mix()`, `calc()` channels, HWB, Lab/LCH, OKLab/OKLCH, and `color(display-p3 …)`.
A complete function receives one color range; picking a new color replaces that
expression with a hex or RGB literal. Nested argument colors are not separate,
overlapping edit targets.

Advanced colors are converted to 8-bit sRGB. Expressions that need a CSS cascade or
active theme (for example `color-mix(in srgb, var(--brand), white)`) have no computed
swatch. See the [parser documentation](../css-color-parser/README.md) for details.
The browser extension bundle includes the parser and `color-bits`, so the extension
host needs no additional runtime module loader.
