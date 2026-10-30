# Changelog

## 0.2.0

### Changed

- Aligned optional xterm.js terminal rendering with the updated Console host and core dependencies.

## 0.1.0

### Added

- Use xterm.js as an optional terminal renderer, including ANSI/VT escape handling and terminal text selection.
- Stream append-only output efficiently, replay content when the source is replaced, and dispose terminal resources on unmount.
- Keep Console's built-in output renderer available when the addon is not installed.

### Fixed

- Prevent the outer Console surface from expanding or scrolling unexpectedly as xterm output grows.
- Fit terminal columns and rows to the available panel dimensions as the container resizes.
