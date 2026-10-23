# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Credential-free Playwright coverage for invited authentication, local-first cloud synchronization, restore, conflict recovery, retries, deletion, and offline gameplay.

## [0.1.1] - 2026-10-22
### Changed
- Production distribution is generated as a single self-contained `dist/index.html`.

## [0.1.0] - 2026-10-22
### Added
- Vite as the development and build tool.
- Extracted CSS and 32 JS scripts while preserving their order.
- Spanish/English translation catalogs and runtime-compatible injection.
- Unit tests, Playwright tests, and browser CI.
- Architecture documentation and agent instructions.

### Known limitations
- Domain code, SVG, and dynamic translations remain partially embedded in the legacy runtime.
- Linux WebKit does not replace real Safari iOS testing.
