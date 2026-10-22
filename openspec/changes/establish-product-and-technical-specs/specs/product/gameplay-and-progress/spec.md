# Spec Delta

## Purpose

This capability defines the observable educational experience of TT Rocket Stars: practicing multiplication and division, progressing with independent pilots, and receiving understandable, safe progression for children.

## ADDED Requirements

### Requirement: The game provides contextualized mathematics practice
The application SHALL provide multiplication and division questions within tables 1–12, integrated into space missions, with a determinable correct answer.

#### Scenario: Multiplication question
- **WHEN** the pilot starts a multiplication activity
- **THEN** the application displays an operation from tables 1–12 and allows the pilot to answer it

#### Scenario: Division question
- **WHEN** the pilot starts a division activity
- **THEN** the application displays a mathematically correct division within the scope of tables 1–12

### Requirement: Progress is separated per pilot
The application SHALL allow each pilot to retain separate progress, including missions, planets, rockets, coins, and achievements, without mixing it with other pilots.

#### Scenario: Switch pilot
- **WHEN** the user selects another pilot
- **THEN** the application shows only the progress associated with that pilot

#### Scenario: Create a new pilot
- **WHEN** the user creates a pilot
- **THEN** the pilot starts with an independent initial state and existing pilot progress remains unchanged

### Requirement: Missions and rewards communicate progress
The application SHALL communicate answer results and mission progress through rewards and states that are understandable to the pilot.

#### Scenario: Correct answer
- **WHEN** the pilot answers correctly
- **THEN** the application indicates success and updates the corresponding progress or reward

#### Scenario: Incorrect answer
- **WHEN** the pilot answers incorrectly
- **THEN** the application indicates the result without recording a correct answer or silently losing previous progress

### Requirement: The pilot controls experience settings
The application SHALL provide controls for language, sound, and experience options that are accessible from the interface and preserve the selected state when supported.

#### Scenario: Change language
- **WHEN** the pilot switches between Spanish and English
- **THEN** visible labels and messages update to the selected language without leaving functional text untranslated

#### Scenario: Disable sound
- **WHEN** the pilot disables sound
- **THEN** subsequent actions do not play audio until sound is enabled again

### Requirement: Progress can be backed up and restored
The application SHALL allow the user to explicitly back up and restore progress, preserve per-pilot separation, and reject invalid data without deleting the current state.

#### Scenario: Restore a valid backup
- **WHEN** the pilot selects a valid compatible backup
- **THEN** the application restores the included profiles and progress and communicates the result

#### Scenario: Restore an invalid backup
- **WHEN** the pilot selects a corrupt or incompatible file
- **THEN** the application displays an error and leaves existing progress intact

### Requirement: The experience is usable on mobile devices
The application SHALL support touch interaction on mobile and tablet devices, portrait and landscape orientations, safe areas, sufficient contrast, understandable navigation, and the system reduced-motion preference.

#### Scenario: Touch interaction
- **WHEN** the pilot uses a touch device
- **THEN** the pilot can start a mission, answer, navigate, and open settings without relying on precise pointer input or a physical keyboard

#### Scenario: Reduced motion
- **WHEN** the system requests reduced motion
- **THEN** the application avoids or reduces non-essential animations without hiding information or blocking interaction
