# Changelog

## Unreleased

### Added

- Opt-in accessible progress strip via `createConsoleProcessStateAddon({ indicator: true })` or the standalone `ConsoleProgressIndicator`; remains headless by default.
- Native OSC 9;4 progress semantics: clear, normal, error, indeterminate, pause and 0–100 clamping without any xterm dependency.

## 0.1.0

### Added

- Stateful OSC 9;4 progress, OSC 9;9 cwd, OSC 133 command lifecycle and OSC 777 notification parsing.
- A subscribable, host-accessible process-state service. Notifications are only data; no OS notification side effects.
