# Changelog

## 0.2.0

### Changed

- Format absolute and relative timestamps for a supplied locale using `Intl.RelativeTimeFormat` and `Date#toLocaleString`; support English, Spanish, French, Brazilian Portuguese, and European Portuguese through the `locale` option.
- Preserve the custom `formatTimestamp` override for applications that need their own timestamp presentation.
- Requires `@moyarich/console-core` version `0.2.x` (peer dependency `^0.2.0`); applications using `0.1.x` must upgrade the host package alongside this addon.

## 0.1.0

### Added

- Removable timestamp and source labels for structured and terminal/process output.
- Independent controls, absolute/relative timestamp modes and custom formatter.
- Missing metadata fallback without mutating the original entries.
