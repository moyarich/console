# VS Code demo system

This directory contains the runnable demo framework for
`@moyarich/vscode-visualize-css-colors`.

## Directory map

- `scenarios/` — self-contained demo scenarios. Each scenario exports its
  metadata, source fixture, and Playwright `run()` steps.
- `scenarios/generated/` — runnable scenarios created by Playwright codegen.
- `runtime/` — shared Node, VS Code, Playwright, recording, and codegen
  infrastructure.
- `ui/` — visual helpers injected into the VS Code workbench while recording.
- `cli/` — multi-scenario, GIF, and interactive command-line entrypoints.
- `dev/` — fixtures used by manual extension-development workflows.
- `artifacts/` — generated screenshots, frames, and videos.

## Run one scenario directly

From the package root:

```bash
node demo/scenarios/basic-colors.mjs
```

Every handwritten scenario is independently executable:

```bash
node demo/scenarios/color-mix.mjs
node demo/scenarios/relative-colors.mjs
node demo/scenarios/source-colors.mjs
```

Direct execution uses the shared runtime, but the scenario file owns the demo
steps.

## Record actions into a generated scenario

Run an existing scenario with `--codegen`:

```bash
node demo/scenarios/color-mix.mjs --codegen
```

Playwright Inspector records the interactions and writes a runnable module to
`scenarios/generated/`. Generated scenarios use the same module contract as
handwritten scenarios and can be run directly with Node.

## Run multiple scenarios

```bash
node demo/cli/run.mjs --demo --scenario=all
node demo/cli/run.mjs --demo --scenario=basic-colors,color-mix
node demo/cli/run.mjs --list
```

The scenario registry in `scenarios/index.mjs` is the single source of truth
for discovery. The interactive CLI consumes that registry instead of scanning
the filesystem independently.

## Runtime responsibilities

`runtime/run-scenario.mjs` coordinates one scenario.

- `runtime/vscode-runtime.mjs` builds/downloads VS Code, creates the temporary
  workspace, launches the extension host, and attaches Playwright over CDP.
- `runtime/video-recorder.mjs` captures screencast frames and encodes WebM
  output with FFmpeg.
- `runtime/codegen-recorder.mjs` adapts Playwright Inspector output into a
  runnable scenario module.
- `runtime/extension-host.cjs` runs inside the VS Code extension host,
  activates the extension, validates the color provider, and waits for the
  recorder completion handshake.

## Demo UI

Each injected UI helper keeps its component, stylesheet, installer, and browser
usage page together:

```text
ui/caption/
  element.mjs
  install.mjs
  styles.css
  usage.html

ui/magnifier/
  element.mjs
  install.mjs
  styles.css
  usage.html
```

This keeps browser component code separate from the Node adapter that injects
it into VS Code.
