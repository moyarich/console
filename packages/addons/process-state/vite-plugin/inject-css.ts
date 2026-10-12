import type { Plugin } from "vite";

/**
 * Preserves the package's existing behavior where importing the JavaScript
 * entry also installs its bundled styles in the browser.
 */
export function injectCssIntoJs(): Plugin {
  return {
    name: "console:inject-css-into-js",
    apply: "build",

    generateBundle(_options, bundle) {
      const cssAssets = Object.entries(bundle).filter(
        ([fileName, output]) =>
          output.type === "asset" && fileName.endsWith(".css"),
      );

      if (cssAssets.length === 0) return;

      const css = cssAssets
        .map(([, output]) =>
          typeof output.source === "string"
            ? output.source
            : new TextDecoder().decode(output.source),
        )
        .join("\n");

      const injection =
        'if (typeof document !== "undefined") {' +
        'const style = document.createElement("style");' +
        `style.textContent = ${JSON.stringify(css)};` +
        "document.head.appendChild(style);" +
        "}\n";

      for (const output of Object.values(bundle)) {
        if (output.type === "chunk" && output.isEntry) {
          output.code = injection + output.code;
        }
      }

      for (const [fileName] of cssAssets) {
        delete bundle[fileName];
      }
    },
  };
}
