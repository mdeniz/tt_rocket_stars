# stable-index-next Specification

## Purpose
The deployment exposes a stable public release and a separate development build for internal verification.

## Requirements

### Requirement: Publish stable and development entrypoints separately

The deployment MUST publish the latest released self-contained application at `index.html` and the current development build at `index_next.html`.

#### Scenario: Public URL serves the stable release

- **WHEN** a user opens the root GitHub Pages URL
- **THEN** the browser loads the latest GitHub Release application from `index.html`
- **AND** it does not redirect to `index_next.html`

#### Scenario: Development URL serves the current build

- **WHEN** an internal reviewer opens `/index_next.html`
- **THEN** the browser loads the application built from the current deployment revision

#### Scenario: Local build remains usable before a release exists

- **WHEN** a developer runs the build locally without a GitHub Release available
- **THEN** both `dist/index.html` and `dist/index_next.html` are self-contained applications

### Requirement: Inline JavaScript is parser-safe

The self-contained entrypoints MUST encode closing script sequences inside inline JavaScript so the HTML parser cannot terminate an application payload early.

#### Scenario: Initial document parse does not expose the bundle

- **WHEN** a browser loads either entrypoint
- **THEN** no application JavaScript is rendered as visible document text before the splash screen
- **AND** the document does not acquire an abnormal height from leaked inline source
