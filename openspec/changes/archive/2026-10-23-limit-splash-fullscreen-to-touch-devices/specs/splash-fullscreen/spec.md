# Spec Delta

## Purpose

Provide device-appropriate fullscreen behavior while keeping game entry reliable across desktop browsers, touch devices, and browsers without fullscreen support.

## ADDED Requirements

### Requirement: Automatic fullscreen is limited to touch-oriented devices

The application SHALL request fullscreen during splash entry only when the browser exposes touch or coarse-pointer capabilities, without using viewport width as the deciding signal.

#### Scenario: Desktop entry remains windowed
- **WHEN** a desktop browser enters from the splash screen without touch or coarse-pointer capabilities
- **THEN** the application SHALL not request fullscreen and SHALL open the dashboard

#### Scenario: Narrow desktop entry remains windowed
- **WHEN** a desktop browser has a narrow viewport but no touch or coarse-pointer capabilities
- **THEN** the application SHALL not request fullscreen

#### Scenario: Touch device entry requests fullscreen
- **WHEN** a touch-oriented browser enters from the splash screen and supports `requestFullscreen`
- **THEN** the application SHALL request fullscreen as part of the user gesture and SHALL open the dashboard

### Requirement: Fullscreen failures do not block game entry

The application SHALL continue splash navigation when fullscreen is unavailable, rejected, or throws an exception.

#### Scenario: Fullscreen is unsupported
- **WHEN** the user enters from the splash screen in a browser without `requestFullscreen`
- **THEN** the dashboard SHALL open without an uncaught exception

#### Scenario: Fullscreen request is rejected
- **WHEN** a supported browser rejects the automatic fullscreen request
- **THEN** the dashboard SHALL still open without an uncaught exception

### Requirement: Manual fullscreen remains available

The application SHALL preserve the existing manual fullscreen control independently of the automatic splash-entry policy.

#### Scenario: Desktop user toggles fullscreen manually
- **WHEN** a desktop user activates the existing fullscreen control
- **THEN** the application SHALL retain its current manual fullscreen behavior
