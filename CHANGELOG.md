# Changelog

## 0.1.0

### Added

- Render structured browser-style console messages with inspectable JavaScript values.
- Render ANSI-aware stdout and stderr output for embedded developer tools and runtime views.
- Capture existing `console.*` calls or create isolated console-compatible producers for sandboxed code.
- Manage console message state with React hooks and a reusable event channel.
- Serialize console events safely across iframe and WebSocket transports.
- Customize messages, values, links, actions, panels, keyboard shortcuts, and other rendering extension points.
- Compose reusable Console addons through the public addon SDK and `@moyarich/console-core`.
- Use first-party addons for imperative scrolling, data export, diagnostics, filtering, and resizable console surfaces.
- Import reusable console and terminal utilities through dedicated secondary package entry points.
