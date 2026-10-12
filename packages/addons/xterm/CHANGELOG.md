# Changelog

## Unreleased

### Fixed

- Keep the outer Console surface from scrolling or expanding with xterm output.
- Fit xterm columns and rows to the available panel height and width as its container resizes.

## 0.1.0

### Added

- Opt-in xterm.js terminal output renderer with append-only streaming, replay on source replacement, and unmount disposal.
- Terminal selection and ANSI/VT escape handling, preserving the built-in renderer when the addon is absent.
