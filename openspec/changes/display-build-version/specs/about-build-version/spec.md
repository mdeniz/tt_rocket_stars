# About Build Version

## ADDED Requirements

### Requirement: Show the running build version

The About screen MUST show a clearly labeled application version sourced from the canonical project version.

#### Scenario: English About screen

- **WHEN** an English user opens About
- **THEN** the screen shows the localized version label and the current `package.json` version

#### Scenario: Spanish About screen

- **WHEN** a Spanish user opens About
- **THEN** the screen shows the Spanish version label and the current `package.json` version

### Requirement: Preserve offline operation

The version display MUST be available in development and self-contained builds without authentication, network requests, or changes to local pilot storage.

#### Scenario: Offline self-contained artifact

- **WHEN** the self-contained release HTML is opened without network access
- **THEN** About still displays the injected version and local gameplay remains available
