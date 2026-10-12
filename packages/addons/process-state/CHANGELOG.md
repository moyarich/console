# Changelog

## 0.1.0

### Added

- Track terminal progress, current directory, command lifecycle, and notifications through OSC 9;4, OSC 9;9, OSC 133, and OSC 777 sequences.
- Access parsed process state through a subscribable controller and host service without requiring xterm.js.
- Display an accessible progress strip with `createConsoleProcessStateAddon({ indicator: true })` or the standalone `ConsoleProgressIndicator`; the addon remains headless by default.
- Support OSC 9;4 progress states for clear, normal, error, indeterminate, and pause, with percentage values clamped to 0–100.

Notifications are exposed as data; they do not trigger operating-system notifications.
