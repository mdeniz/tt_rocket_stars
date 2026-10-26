# Spec Delta

## MODIFIED Requirements

### Requirement: Pilot persistence remains isolated and offline-first

The application SHALL read and write active-pilot data locally without requiring network access, and SHALL keep each pilot's progress independent. The opt-in React persistence path SHALL use the same validated boundary and SHALL retain a legacy-compatible fallback.

#### Scenario: Switch between valid pilots
- **WHEN** the user selects another stored pilot
- **THEN** the active storage view changes to that pilot's payload without mixing progress between pilots
- **AND** the React-enabled path updates the active-pilot reference through the typed persistence boundary

#### Scenario: React persistence is unavailable
- **WHEN** the React persistence path is disabled or cannot handle a valid operation
- **THEN** the legacy-compatible persistence path remains usable
- **AND** no pilot progress or backup data is removed

#### Scenario: Storage is unavailable
- **WHEN** the browser rejects a local storage read or write
- **THEN** the application remains playable, reports the limitation when appropriate, and does not intentionally remove other data

#### Scenario: Local persistence has no network dependency
- **WHEN** a pilot selects, creates, or switches profiles while offline
- **THEN** the operation completes from local state or fails safely
- **AND** no authentication, cloud configuration, or network request is required
