# Changelog

## 0.2.0

### Changed

- Localized xterm.js addon interface text and controls, including Portuguese translations.
- Updated the required peer dependency range for `@moyarich/console-core` and `@moyarich/console` from `^0.1.0` to `^0.2.0`.

## 0.1.0

### Added

- Use xterm.js as an optional terminal renderer, including ANSI/VT escape handling and terminal text selection.
- Stream append-only output efficiently, replay content when the source is replaced, and dispose terminal resources on unmount.
- Keep Console's built-in output renderer available when the addon is not installed.

### Fixed

- Prevent the outer Console surface from expanding or scrolling unexpectedly as xterm output grows.
- Fit terminal columns and rows to the available panel dimensions as the container resizes.
