# Spec Delta

## MODIFIED Requirements

### Requirement: React shell owns migrated navigation

The application SHALL render one responsive shell for splash completion, primary navigation, pilot selection, and settings entry without duplicating those controls in the legacy DOM. When the legacy animated launch scene is available, it SHALL remain the visible splash entry surface; the React splash SHALL be used only as a fallback when that scene is unavailable.

#### Scenario: Shell starts with local gameplay available
- **WHEN** the application loads without network access or cloud configuration
- **THEN** the shell SHALL allow the user to enter local gameplay without an authentication request

#### Scenario: Animated splash remains visible
- **WHEN** the application loads with the legacy launch scene present
- **THEN** the launch scene SHALL remain visible and the React placeholder SHALL not occlude it

#### Scenario: React splash is used as a fallback
- **WHEN** the legacy launch scene is absent or cannot be mounted
- **THEN** the React splash SHALL provide an accessible entry control that opens local gameplay

#### Scenario: Navigation changes the active surface
- **WHEN** the user selects a shell navigation item
- **THEN** the selected surface SHALL become visible and the previous surface SHALL be hidden without duplicate navigation controls

### Requirement: Shell preserves pilot isolation

The shell SHALL use the existing pilot persistence contract for selection, creation, and active-pilot synchronization.

#### Scenario: User switches pilots
- **WHEN** the user selects another valid pilot
- **THEN** the shell SHALL activate that pilot without mixing payloads or renaming existing storage keys

#### Scenario: User creates a pilot
- **WHEN** the user submits a valid pilot name
- **THEN** the shell SHALL create and activate an isolated pilot while preserving the current pilot's progress

### Requirement: Shell settings remain accessible and translated

The shell SHALL expose sound, language, theme, backup, reset, pilot, and optional cloud settings through stable accessible controls with complete English and Spanish translations.

#### Scenario: User opens settings
- **WHEN** the user opens Settings from the shell
- **THEN** settings categories SHALL be keyboard and touch accessible and only the selected category content SHALL be active

#### Scenario: User changes language
- **WHEN** the user selects English or Spanish
- **THEN** the shell and active settings labels SHALL update without losing the active pilot

### Requirement: Shell migration remains self-contained

The migrated shell SHALL remain compatible with the self-contained production build and SHALL not require remote assets or runtime network requests for local gameplay.

#### Scenario: Production build is generated
- **WHEN** the project runs its production build
- **THEN** the generated application SHALL remain self-contained and retain the legacy gameplay fallback during incremental migration
