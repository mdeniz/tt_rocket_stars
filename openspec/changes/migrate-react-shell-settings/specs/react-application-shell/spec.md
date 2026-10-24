# Spec Delta

## Purpose

Provide a single accessible application shell for entry, navigation, pilot selection, and settings while preserving the offline-first game and incremental legacy migration boundary.

## ADDED Requirements

### Requirement: React shell owns migrated navigation
The application SHALL render one responsive shell for splash completion, primary navigation, pilot selection, and settings entry without duplicating those controls in the legacy DOM.

#### Scenario: Shell starts with local gameplay available
- **WHEN** the application loads without network access or cloud configuration
- **THEN** the shell SHALL allow the user to enter local gameplay without an authentication request

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
