# @moyarich/console-addon-markdown

Render Markdown in Console values. Render detected GitHub Flavored Markdown inside structured messages; ordinary strings remain plain text.

## Install

```bash
npm install @moyarich/console @moyarich/console-addon-markdown
```

## Quick start

```tsx
import { Console } from "@moyarich/console";
import { createConsoleMarkdownAddon } from "@moyarich/console-addon-markdown";

const addons = [createConsoleMarkdownAddon()];

// Pass your application's structured messages to Console.
<Console messages={messages} addons={addons} />;
```

## Rendering behavior

The addon automatically detects GitHub Flavored Markdown in string values. Plain strings and bare URLs retain their normal console presentation.

Markdown includes headings, lists, task lists, blockquotes, links, fenced code blocks, and tables. Fenced code blocks display their declared language, preserve whitespace, and scroll horizontally when needed. Tables also scroll horizontally rather than stretching the console.

Styles inherit the console font and foreground color, use relative contrast-aware surfaces and borders, and honor keyboard focus and forced-color modes. Language labels are not syntax highlighting; code tokens are not yet colored.

The addon renders Markdown within the React console UI. It does **not** turn a native terminal process into a Glow-like CLI renderer.

The addon is optional and can be combined with other Console addons. The host application remains responsible for supplying and retaining messages.

## Learn more

Explore [runnable package examples](./examples) and the [Console documentation](https://moyarich.github.io/console/) for available settings and integration patterns.

Review the [changelog](./CHANGELOG.md) for changes by version and [package metadata](./package.json) for dependency requirements.

## License

MIT
