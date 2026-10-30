# Changelog

## 0.2.0

### Added
- Render GitHub Flavored Markdown with headings, task lists, blockquotes, links, code fences, and tables while preserving plain-text output for ordinary messages.
- Highlight fenced code using Shiki, with a plain-text fallback for unsupported languages and theme-aware contrast.
- Support MDXProvider component overrides and sanitize rendered links.
### Fixed
- Preserve fenced-code whitespace, highlighted line breaks, and horizontally scrollable tables in narrow consoles.

## 0.1.0

### Added

- Automatically recognize Markdown content in Console string values.
- Render recognized content as GitHub Flavored Markdown in structured console messages.
- Leave plain text, ordinary multiline logs, and standalone URLs on the normal text-rendering path.
- Integrate Markdown rendering through the Console value-renderer extension point.
