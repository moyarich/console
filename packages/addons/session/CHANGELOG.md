# Changelog

## 0.2.0

### Changed

- Updated the required peer dependency range for `@moyarich/console` from `^0.1.0` to `^0.2.0`.
- No separate user-facing feature or behavior change is identified for this addon in this version.

## 0.1.0

### Added

- Create, serialize, parse, and restore versioned Console sessions for structured messages and terminal output.
- Preserve dropped-history counts in session snapshots.

### Fixed

- Preserve JSON-safe rich terminal metadata when saving and restoring sessions, including cyclic values.
- Reject malformed terminal metadata instead of accepting invalid snapshots.
