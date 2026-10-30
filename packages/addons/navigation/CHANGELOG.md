# Changelog

## 0.2.0

### Changed

- Requires `@moyarich/console-core` version `0.2.x` (peer dependency `^0.2.0`); applications using `0.1.x` must upgrade the host package alongside this addon.

## 0.1.0

### Added

- Navigate forward and backward among visible errors and warnings.
- Jump between annotated or bookmarked messages when an annotation controller is present.
- Jump directly to a stable message ID through the viewport service.
- Expose the current navigation target and start/end boundary state for custom host controls.
- Register keyboard shortcuts for navigating error and warning messages.
