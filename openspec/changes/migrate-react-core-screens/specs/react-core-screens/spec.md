# Spec Delta

## Purpose

Provides a testable React ownership boundary for core game screens while keeping gameplay, offline persistence, accessibility, and legacy compatibility stable during incremental migration.

## ADDED Requirements

### Requirement: Core screen navigation remains available offline

The application SHALL let a pilot navigate between dashboard, progress, mission setup, garage, and achievements without authentication or network access.

#### Scenario: Offline navigation

- **WHEN** the application is loaded without network access and a pilot opens a core screen
- **THEN** the requested screen becomes visible
- **AND** no network request is required for navigation

### Requirement: Core screen actions preserve gameplay contracts

The application SHALL preserve mission selection, timers, auto-next behavior, audio feedback, rocket customization, coin balances, and achievement state while React owns a core screen.

#### Scenario: Mission setup delegates to gameplay

- **WHEN** a pilot selects tables and a mission mode and starts a mission
- **THEN** the existing gameplay flow starts with the selected configuration
- **AND** the timer, audio, answer progression, and local progress behavior remain unchanged

#### Scenario: Garage actions delegate to the existing rocket store

- **WHEN** a pilot equips or purchases a rocket part
- **THEN** the visible rocket and coin balance update
- **AND** the pilot-local garage storage remains compatible with existing backups

### Requirement: Core screens are accessible in both supported languages

The application SHALL expose English and Spanish labels, status text, and accessible names for migrated core screen controls.

#### Scenario: Spanish core screen

- **WHEN** the pilot selects Spanish and opens a migrated core screen
- **THEN** screen labels and interactive control names are rendered in Spanish
- **AND** keyboard and touch activation remain available

### Requirement: React migration has a legacy-compatible rollback path

The application SHALL retain stable screen identifiers and legacy behavior until equivalent React coverage has passed.

#### Scenario: Legacy fallback

- **WHEN** the React core-screen bridge is disabled or unavailable
- **THEN** the legacy screen remains navigable
- **AND** no pilot progress or backup data is removed

