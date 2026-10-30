# Changelog

## 0.2.0

### Release preparation

- Prepare this package for the coordinated `0.2.0` workspace release.
- Align applicable internal workspace dependency and peer dependency ranges with version `0.2.0`.

## 0.1.0

### Added

- Create, serialize, parse, and restore versioned Console sessions for structured messages and terminal output.
- Preserve dropped-history counts in session snapshots.

### Fixed

- Preserve JSON-safe rich terminal metadata when saving and restoring sessions, including cyclic values.
- Reject malformed terminal metadata instead of accepting invalid snapshots.
