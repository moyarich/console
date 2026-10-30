# Changelog

## 0.2.0

### Changed

- Aligned session snapshot and restore helpers with the updated Console host dependency and event contracts.

## 0.1.0

### Added

- Create, serialize, parse, and restore versioned Console sessions for structured messages and terminal output.
- Preserve dropped-history counts in session snapshots.

### Fixed

- Preserve JSON-safe rich terminal metadata when saving and restoring sessions, including cyclic values.
- Reject malformed terminal metadata instead of accepting invalid snapshots.
