# Spec Delta

## MODIFIED Requirements

### Requirement: Missions and rewards communicate progress

The application SHALL communicate answer results and mission progress through rewards and states that are understandable to the pilot, regardless of whether the active mission orchestration is React-owned or using the legacy fallback.

#### Scenario: React-owned correct answer

- **WHEN** the pilot answers a React-owned question correctly
- **THEN** the application indicates success and updates the corresponding pilot progress or reward
- **AND** the updated state is available to the next question without a page reload

#### Scenario: Correct answer

- **WHEN** the pilot answers correctly in the legacy-compatible mission flow
- **THEN** the application indicates success and updates the corresponding progress or reward

#### Scenario: React-owned incorrect answer

- **WHEN** the pilot answers a React-owned question incorrectly
- **THEN** the application indicates the result without recording a correct answer
- **AND** previous pilot progress remains intact

#### Scenario: Incorrect answer

- **WHEN** the pilot answers incorrectly in the legacy-compatible mission flow
- **THEN** the application indicates the result without recording a correct answer or silently losing previous progress

### Requirement: Progress can be backed up and restored

The application SHALL allow the user to explicitly back up and restore progress from React-owned gameplay without renaming persisted keys, changing compatible backup payloads, or deleting current state on invalid input.

#### Scenario: React mission state is backed up

- **WHEN** the pilot backs up progress after a React-owned mission action
- **THEN** the backup contains the same compatible pilot, mission, reward, and progression data as the legacy path
- **AND** the backup can be restored by the existing compatible restore flow

#### Scenario: Restore a valid backup

- **WHEN** the pilot selects a valid compatible backup
- **THEN** the application restores the included profiles and progress and communicates the result

#### Scenario: Invalid React restore

- **WHEN** the pilot selects a corrupt or incompatible backup after using React-owned gameplay
- **THEN** the application displays an error and leaves existing progress intact

#### Scenario: Restore an invalid backup

- **WHEN** the pilot selects a corrupt or incompatible file in the legacy-compatible restore flow
- **THEN** the application displays an error and leaves existing progress intact
