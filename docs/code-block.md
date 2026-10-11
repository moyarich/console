# CodeBlock

`CodeBlock` is a read-only React code viewer in `apps/playground`, with Shiki syntax highlighting and a source-copy action. It is separate from the editable Monaco playground and is local to the playground.

```tsx
import { CodeBlock } from "../components/CodeBlock/CodeBlock";

export function Example() {
  return (
    <CodeBlock
      filename="example.ts"
      language="typescript"
      showLineNumbers
      code={'const color = "lab(60% 40 -30 / 75%)";'}
    />
  );
}
```

`code` is required. Optional props are `language` (default `text`), `filename`, `showLineNumbers`, `copyable` (default `true`), plus standard section HTML attributes. The copy button copies the **original source**, not highlighted HTML.

Shiki is loaded asynchronously when the component mounts. Until highlighting is ready (or if an unsupported language or loading error occurs), source remains readable as plain text.

## Styling

The component keeps its CSS in `apps/playground/src/components/CodeBlock/CodeBlock.css`, using public theme inputs with private fallbacks:

- `--console-code-block-background`
- `--console-code-block-color`
- `--console-code-block-border`
- `--console-code-block-radius`
- `--console-code-block-toolbar-background`
- `--console-code-block-muted-color`

Copy feedback is announced with `aria-live`; the button has a visible keyboard focus outline.
