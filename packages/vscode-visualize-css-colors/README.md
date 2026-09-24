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

## Monaco VS Code API

Build the package first so `dist/extension.js` is available, then register the web
extension after the VS Code services are initialized.

```ts
import {
  ExtensionHostKind,
  registerExtension,
} from "@codingame/monaco-vscode-api/extensions";
import {
  vscodeVisualizeCssColorsBrowserPath,
  vscodeVisualizeCssColorsManifest,
} from "@moyarich/vscode-visualize-css-colors";
import extensionUrl from "@moyarich/vscode-visualize-css-colors/extension.js?url";

export async function registerVisualizeCssColors() {
  const extension = registerExtension(
    vscodeVisualizeCssColorsManifest,
    ExtensionHostKind.LocalProcess,
  );

  extension.registerFileUrl(
    vscodeVisualizeCssColorsBrowserPath,
    extensionUrl,
  );

  await extension.whenReady?.();

  return extension;
}
```

With `@typefox/monaco-editor-react`, call that registration from
`onVscodeApiInitDone`:

```tsx
<MonacoEditorReactComp
  vscodeApiConfig={vscodeApiConfig}
  editorAppConfig={editorAppConfig}
  onVscodeApiInitDone={registerVisualizeCssColors}
/>
```

The executable extension bundle is CommonJS because the VS Code web extension host
expects a bundled extension module rather than application ESM. The extension imports
only the `vscode` API and the parser package; it does not use Node-only APIs.
