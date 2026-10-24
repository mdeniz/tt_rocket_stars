# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Isolated, framework-agnostic TypeScript game-rule and progression contracts with deterministic tests.
- An isolated React mount contract and strict no-emit TypeScript bootstrap alongside the legacy runtime.
- Credential-free Playwright coverage for invited authentication, local-first cloud synchronization, restore, conflict recovery, retries, deletion, and offline gameplay.
- A consent-aware, provider-independent telemetry boundary with allowlisted aggregate events and no default network activity.
- Sampled aggregate mission and sanitized runtime-error hooks with bounded in-memory retention.
- Cloud access is hidden by default behind an explicit development flag. GitHub Pages now keeps the latest release at `index.html` and publishes the current build separately at `index_next.html`.
- Added the initial typed shell contract for the incremental React migration.
- Mounted an isolated React shell boundary while preserving the legacy startup order and self-contained release output.
- Added validated local profile, backup, and cloud snapshot persistence contracts with storage fallback and legacy-key compatibility.

## [0.1.1] - 2026-10-22
### Changed
- Production releases remain self-contained HTML assets. GitHub Pages uses the latest release asset for `index.html` and keeps the current build available as `index_next.html` for internal verification.

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
