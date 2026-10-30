# Changelog

## 0.2.0

### Changed

- Updated the required peer dependency range for `@moyarich/console-core` from `^0.1.0` to `^0.2.0`.

## 0.1.0

### Added

- Automatically recognize Markdown content in Console string values.
- Render recognized content as GitHub Flavored Markdown in structured console messages.
- Leave plain text, ordinary multiline logs, and standalone URLs on the normal text-rendering path.
- Integrate Markdown rendering through the Console value-renderer extension point.
