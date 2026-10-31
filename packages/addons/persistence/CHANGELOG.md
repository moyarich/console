# Changelog

## 0.2.0

### Added

- Save Console output through memory, WritableStream, local file, and SQLite persistence adapters.
- Demonstrate seeded log messages in the persistence Storybook examples, including SQLite and NDJSON file output.

### Fixed

- Serialize concurrent flush operations to avoid resetting an active write chain; cover batching, retry, and backpressure.
- Keep persistence data notifications isolated to each Console instance using EventEmitter3.

### Changed

- Requires `@moyarich/console-core@^0.2.0`; upgrade the host and directly installed core SDK from 0.1.x alongside this addon.

## 0.1.0

### Added

- Destination-agnostic persistence adapters for Console messages and event-driven host integrations.
