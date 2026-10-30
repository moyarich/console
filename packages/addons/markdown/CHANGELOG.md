# Changelog

## 0.2.0

### Release preparation

- Prepare this package for the coordinated `0.2.0` workspace release.
- Align applicable internal workspace dependency and peer dependency ranges with version `0.2.0`.

## 0.1.0

### Added

- Automatically recognize Markdown content in Console string values.
- Render recognized content as GitHub Flavored Markdown in structured console messages.
- Leave plain text, ordinary multiline logs, and standalone URLs on the normal text-rendering path.
- Integrate Markdown rendering through the Console value-renderer extension point.
