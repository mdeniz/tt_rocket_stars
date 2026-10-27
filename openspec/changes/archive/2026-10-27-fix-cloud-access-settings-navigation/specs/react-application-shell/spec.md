# Spec Delta

## MODIFIED Requirements

### Requirement: Shell settings remain accessible and translated

The shell SHALL expose sound, language, theme, backup, reset, pilot, and
optional cloud settings through stable accessible controls with complete English
and Spanish translations. When the cloud-access feature flag is enabled, Cloud
access SHALL be represented by an accessible Settings category; when disabled,
the category SHALL not be visible or selectable.

#### Scenario: User opens settings

- **WHEN** the user opens Settings from the shell
- **THEN** settings categories SHALL be keyboard and touch accessible and only the selected category content SHALL be active

#### Scenario: User changes language

- **WHEN** the user selects English or Spanish
- **THEN** the shell and active settings labels SHALL update without losing the active pilot

#### Scenario: Cloud access is enabled

- **WHEN** a controlled development build enables the cloud-access feature flag
- **THEN** Settings SHALL expose an accessible Cloud access category
- **AND** activating it SHALL show the cloud authentication controls without activating a local category

#### Scenario: Cloud access is disabled

- **WHEN** the cloud-access feature flag is disabled
- **THEN** the Cloud access panel and category SHALL remain hidden and unselectable
- **AND** local Settings categories SHALL remain available
