# Changelog

## 0.2.0

### Changed

- Requires `@moyarich/console-core` version `0.2.x` (peer dependency `^0.2.0`); applications using `0.1.x` must upgrade the host package alongside this addon.

## 0.1.0

### Added

- Opt-in HTTP/HTTPS detection for structured and terminal output via the link-provider extension point.
- Export `detectWebLinks`, `webLinkProvider`, and `createConsoleLinksAddon`.
