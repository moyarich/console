import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { scenarios, selectScenarios } from "../demo/scenarios/index.mjs";
import {
  readExtensionManifest,
  stageExtension,
} from "@moyarich/vscode-dev-toolkit/extension";
import config from "../vscode-dev.config.mjs";

const source = await readFile(
  new URL("../dist/extension.cjs", import.meta.url),
  "utf8",
);

function loadProvider() {
  let provider;
  let registeredLanguages;
  let disposed = false;
  const vscode = {
    languages: {
      registerColorProvider(languages, contribution) {
        registeredLanguages = languages;
        provider = contribution;
        return {
          dispose() {
            disposed = true;
          },
        };
      },
    },
    Color: class {
      constructor(red, green, blue, alpha) {
        Object.assign(this, { red, green, blue, alpha });
      }
    },
    Range: class {
      constructor(start, end) {
        Object.assign(this, { start, end });
      }
    },
    ColorInformation: class {
      constructor(range, color) {
        Object.assign(this, { range, color });
      }
    },
    ColorPresentation: class {
      constructor(label) {
        this.label = label;
      }
    },
  };
  const sandbox = {
    module: { exports: {} },
    require(name) {
      assert.equal(
        name,
        "vscode",
        "The web bundle must not need Node APIs or external npm modules.",
      );
      return vscode;
    },
  };
  // Deliberately no window, document, process, Buffer, or filesystem globals.
  runInNewContext(source, sandbox);
  const context = { subscriptions: [] };
  sandbox.module.exports.activate(context);
  return { provider, registeredLanguages, context, isDisposed: () => disposed };
}
function documentFor(text) {
  return {
    getText: (range) => (range ? text.slice(range.start, range.end) : text),
    positionAt: (offset) => offset,
  };
}

test("desktop and web entries share a standalone CommonJS bundle", async () => {
  const manifest = await readExtensionManifest(config);
  const { extensionDirectory } = await stageExtension(config);
  const staged = JSON.parse(
    await readFile(`${extensionDirectory}/package.json`, "utf8"),
  );
  assert.deepEqual(staged, manifest);
  const { vscodeVisualizeCssColorsManifest } = await import("../dist/index.js");
  assert.deepEqual(vscodeVisualizeCssColorsManifest, manifest);
  assert.equal(manifest.name, "visualize-css-colors");
  assert.equal(manifest.publisher, "moyarich");
  assert.equal(manifest.main, manifest.browser);
  assert.match(manifest.main, /\.cjs$/);
  assert.equal(
    await readFile(`${extensionDirectory}/${manifest.main}`, "utf8"),
    source,
  );
  assert.equal(staged.dependencies, undefined);
  assert.equal(staged.scripts, undefined);
  const embedded = await import("../dist/extension-source.js");
  assert.equal(
    embedded.default,
    source,
    "Monaco must run the same provider as the VSIX.",
  );
});

test("activation registers languages and a disposable provider", () => {
  const loaded = loadProvider();
  for (const language of [
    "css",
    "scss",
    "less",
    "html",
    "javascript",
    "typescript",
    "typescriptreact",
    "vue",
    "svelte",
  ]) {
    assert.ok(loaded.registeredLanguages.includes(language));
  }
  assert.equal(loaded.context.subscriptions.length, 1);
  loaded.context.subscriptions[0].dispose();
  assert.ok(loaded.isDisposed());
});

test("a nested mix has one complete editable range and native presentations", () => {
  const { provider } = loadProvider();
  const expression = "color-mix(in srgb, color-mix(in srgb, red, blue), white)";
  const document = documentFor(`a { color: ${expression}; }`);
  const colors = provider.provideDocumentColors(document);
  assert.equal(colors.length, 1);
  const { range, color } = colors[0];
  assert.equal(document.getText(range), expression);
  assert.equal(Math.round(color.red * 255), 192);
  assert.equal(Math.round(color.green * 255), 128);
  assert.equal(Math.round(color.blue * 255), 192);
  const presentations = provider.provideColorPresentations(color, {
    document,
    range,
  });
  assert.equal(presentations[0].label, "#c080c0");
  const replacement =
    document.getText().slice(0, range.start) +
    presentations[0].label +
    document.getText().slice(range.end);
  assert.equal(replacement, "a { color: #c080c0; }");
});

test("unresolved and malformed expressions produce no misleading result", () => {
  const { provider } = loadProvider();
  for (const expression of [
    "color-mix(in srgb, var(--brand), red)",
    "color-mix(in srgb, currentColor, blue)",
    "color-mix(in srgb, red, blue",
  ]) {
    assert.equal(
      provider.provideDocumentColors(documentFor(expression)).length,
      0,
    );
  }
});

for (const [name, scenario] of Object.entries(scenarios)) {
  test(`demo ${name} exercises this extension's provider`, () => {
    const { provider } = loadProvider();
    const document = documentFor(scenario.source);
    const colors = provider.provideDocumentColors(document);
    assert.ok(colors.length >= 3);
    for (const { range, color } of colors) {
      assert.ok(range.end > range.start);
      assert.ok(
        [color.red, color.green, color.blue, color.alpha].every(
          (channel) => channel >= 0 && channel <= 1,
        ),
      );
      assert.ok(
        provider.provideColorPresentations(color, { document, range }).length >=
          2,
      );
    }
  });
}

test("demo selection fails on obsolete or unknown scenarios", () => {
  assert.equal(selectScenarios().length, 4);
  assert.deepEqual(selectScenarios("color-mix,relative-colors,color-mix"), [
    "color-mix",
    "relative-colors",
  ]);
  assert.throws(() => selectScenarios("unknown"), /Unknown demo scenario/);
});
