# Spec Delta

## ADDED Requirements

### Requirement: React owns flagged dashboard and progress metrics

When the `reactCoreScreens` flag is enabled, the dashboard and progress
surfaces MUST render their metrics from the active pilot's local fact and
mission-history data without reading legacy dashboard DOM.

#### Scenario: Dashboard renders local metrics offline

- **WHEN** the flag is enabled and the active pilot has local facts and mission history
- **THEN** React renders the corresponding mission count, correct-answer total, accuracy, and level
- **AND** the dashboard remains usable without network access

#### Scenario: Progress renders table mastery data

- **WHEN** the progress screen is opened with pilot-local fact statistics
- **THEN** React renders per-table progress derived from those statistics
- **AND** malformed or missing data produces safe empty progress without deleting local storage

#### Scenario: Disabled flag preserves legacy dashboard and progress

- **WHEN** the React core flag is disabled
- **THEN** the legacy dashboard and progress renderers remain visible and navigable
- **AND** no local pilot data is changed
