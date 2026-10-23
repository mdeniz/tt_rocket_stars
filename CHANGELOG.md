# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Isolated, framework-agnostic TypeScript game-rule and progression contracts with deterministic tests.
- An isolated React mount contract and strict no-emit TypeScript bootstrap alongside the legacy runtime.
- Credential-free Playwright coverage for invited authentication, local-first cloud synchronization, restore, conflict recovery, retries, deletion, and offline gameplay.
- A consent-aware, provider-independent telemetry boundary with allowlisted aggregate events and no default network activity.
- Sampled aggregate mission and sanitized runtime-error hooks with bounded in-memory retention.
- Cloud access is hidden by default behind an explicit development flag, and the next self-contained distribution is generated as `dist/index_next.html` with a root compatibility redirect.

## [0.1.1] - 2026-10-22
### Changed
- Production distribution is generated as a single self-contained `dist/index_next.html`; `dist/index.html` remains a root compatibility redirect.

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
