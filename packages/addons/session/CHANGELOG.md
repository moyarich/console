# Changelog

## 0.2.0

### Changed

- Requires `@moyarich/console` version `0.2.x` (peer dependency `^0.2.0`); applications using `0.1.x` must upgrade the host package alongside this addon.

## 0.1.0

### Added

- Create, serialize, parse, and restore versioned Console sessions for structured messages and terminal output.
- Preserve dropped-history counts in session snapshots.

### Fixed

- Preserve JSON-safe rich terminal metadata when saving and restoring sessions, including cyclic values.
- Reject malformed terminal metadata instead of accepting invalid snapshots.
