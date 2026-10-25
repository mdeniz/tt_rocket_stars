# Changelog

- Reconciled completed cloud-sync implementation and operational documentation tasks with their repository test evidence; external provider and production redirect checks remain explicitly pending.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- A flag-gated React mission player with shared multiplication/division rules, timed and exam progression, local-first answer persistence, audio hooks, and legacy rollback.
- Isolated, framework-agnostic TypeScript game-rule and progression contracts with deterministic tests.
- An isolated React mount contract and strict no-emit TypeScript bootstrap alongside the legacy runtime.
- Credential-free Playwright coverage for invited authentication, local-first cloud synchronization, restore, conflict recovery, retries, deletion, and offline gameplay.
- A consent-aware, provider-independent telemetry boundary with allowlisted aggregate events and no default network activity.
- Sampled aggregate mission and sanitized runtime-error hooks with bounded in-memory retention.
- Cloud access is hidden by default behind an explicit development flag. GitHub Pages now keeps the latest release at `index.html` and publishes the current build separately at `index_next.html`.
- Added the initial typed shell contract for the incremental React migration.
- Mounted an isolated React shell boundary while preserving the legacy startup order and self-contained release output.
- Added a typed fullscreen adapter that keeps splash entry safe when the browser API is unavailable or rejects the request.
- Added a typed pilot adapter backed by the existing local persistence and covered local profile creation and switching in Playwright.
- Added a typed settings-category adapter while preserving the legacy panel ownership and translated category labels.
- Added fail-closed typed adapters for React mission, garage, and achievement actions while keeping legacy gameplay and persistence authoritative.
- Recorded full unit, cross-browser, build, and Chrome DevTools verification for the incremental React shell boundary; the visible legacy shell remains intentionally authoritative until the next migration slice.
- Added validated local profile, backup, and cloud snapshot persistence contracts with storage fallback and legacy-key compatibility.
- Added an opt-in React dashboard and progress composition around stable legacy hosts with English and Spanish labels; legacy navigation and persistence remain authoritative.
- Added focused offline and pilot-local Playwright coverage for the React dashboard and progress adapter boundary.
- Added Playwright coverage for React-launched practice and timed missions, proving legacy answer progression, auto-next, audio, timer, and local persistence remain available.
- Added feature-flagged React garage controls and localized achievement progress composition while keeping legacy inventory, rewards, and pilot-local persistence authoritative.
- Added Playwright coverage proving the React core-screen flag can roll back to legacy garage and achievement ownership without losing access to either screen.
- Added a flag-gated React achievement evaluator backed by pilot-local facts and mission history, with localized rendering, offline refresh, malformed-payload handling, and legacy rollback coverage.

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
- Added an opt-in React mission setup surface with typed legacy action delegation for tables, operations, modes, durations, and launch.
