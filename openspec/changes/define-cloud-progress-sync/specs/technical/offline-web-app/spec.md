# Spec Delta

## MODIFIED Requirements

### Requirement: The application works without mandatory network access

The application SHALL allow startup, navigation, gameplay, and progress access
without a network connection or mandatory remote requests after the distributable
HTML has been downloaded. Optional cloud synchronization MUST NOT become a
prerequisite for local play.

#### Scenario: Offline startup
- **WHEN** the user opens the distribution without Internet access
- **THEN** the interface starts and allows the user to reach a mission without relying on a CDN, remote font, external API, or synchronization service

#### Scenario: Remote resource unavailable
- **WHEN** an external resource or optional synchronization service does not respond
- **THEN** core functionality remains available and the application does not show a black screen or fail with an uncaught exception

### Requirement: Local progress is retained per origin and pilot

The application SHALL store progress locally, separate it by pilot, and preserve
compatibility with existing storage names and formats during migrations. Remote
synchronization MUST supplement this local state rather than replace it.

#### Scenario: Reopen on the same origin
- **WHEN** the user closes and reopens the application in the same browser and origin
- **THEN** previously saved local progress is available even without an authenticated session

#### Scenario: Restricted storage
- **WHEN** the browser rejects or limits storage, including Safari private mode
- **THEN** the application handles the error safely and communicates the limitation without deliberately deleting other data

#### Scenario: iOS local-file distribution
- **WHEN** an iPhone or iPad user opens the self-contained HTML directly from the Files app or another `file://` location
- **THEN** the application warns that local progress may not persist reliably and directs the user to the HTTPS deployment

#### Scenario: iOS HTTPS distribution
- **WHEN** an iPhone or iPad user opens the application from the HTTPS deployment
- **THEN** progress is scoped to that HTTPS origin and may persist according to Safari storage policies
