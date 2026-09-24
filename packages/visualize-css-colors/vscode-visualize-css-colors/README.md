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

Build the package first so `dist/extension.js` is available, then register the web
extension in the VS Code API configuration used by the TypeFox editor host.

```ts
import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
import extensionUrl from "@moyarich/vscode-visualize-css-colors/extension.js?url";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";

const filesOrContents = new Map<string, string | URL>([
  [
    vscodeVisualizeCssColorsBrowserPath,
    new URL(extensionUrl, window.location.href),
  ],
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

The extension is registered as a real VS Code web extension. The host loads its
`browser` entry point and activates it through the extension lifecycle, while the
extension registers its `DocumentColorProvider` through the `vscode` API.

The executable extension bundle is CommonJS because the VS Code web extension host
expects a bundled extension module rather than application ESM. The extension imports
only the `vscode` API and the parser package; it does not use Node-only APIs.
