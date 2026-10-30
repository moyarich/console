# Changelog

## 0.2.0

### Changed

- Aligned addon lifecycle, event, and service contracts with Console's EventEmitter3-based notifications.
- Expanded integration coverage for addon activation, readiness, cleanup, and error isolation.

## 0.1.0

### Added

- Shared contracts for building Console hosts and first-party or third-party addons.
- Portable addon activation and lifecycle, service registration, and capability discovery.
- Extension points for custom message rendering, actions, decorations, processors, and host integrations.
- Shared message, output, viewport, and data-service interfaces for structured console and terminal experiences.
- Standard `terminal` mode identifier for process-output hosts and addons.

### Release preparation

- Verify core addon contracts and package dependency versions for independent multi-package publishing.
- Document the separation between package-specific GitHub releases and registry publication.
