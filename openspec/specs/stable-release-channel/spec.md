# stable-release-channel Specification

## Purpose
Provide a safe release channel that keeps the current root entry point stable while exposing the next self-contained application build under an explicit filename.

## Requirements

### Requirement: Cloud access is opt-in in the settings UI
The application MUST hide the Cloud access panel and settings category unless the build explicitly enables the cloud-access feature flag.

#### Scenario: Default build hides cloud access
- **WHEN** the application starts without an explicit cloud-access flag
- **THEN** Settings shows local categories only and Cloud access is not visible or selectable

#### Scenario: Development build enables cloud access
- **WHEN** a controlled development build explicitly enables the cloud-access flag
- **THEN** the Cloud access panel and its authentication controls are available

### Requirement: The next build is self-contained
The release build MUST write the complete standalone application to `index_next.html` with CSS, JavaScript, translations, and required resources embedded.

#### Scenario: Validate the next artifact
- **WHEN** distribution checks run
- **THEN** they verify `index_next.html` has no external scripts or stylesheets and is the only self-contained application artifact

### Requirement: The root entry remains compatible
The deployed distribution MUST provide an `index.html` entry that directs root visitors to `index_next.html` without requiring adjacent application assets.

#### Scenario: Open the Pages root
- **WHEN** a visitor opens the GitHub Pages root URL
- **THEN** the root entry navigates to `index_next.html` and the application starts

### Requirement: Stable and development entrypoints are finalized after build output

The build MUST write the current self-contained application before creating
`index_next.html`, and MUST preserve a stable self-contained `index.html` copy.

#### Scenario: Build creates both entrypoints

- **WHEN** a production build completes
- **THEN** `dist/index_next.html` contains the current self-contained build
- **AND** `dist/index.html` remains a self-contained stable entrypoint
- **AND** both files pass the distribution validation checks
