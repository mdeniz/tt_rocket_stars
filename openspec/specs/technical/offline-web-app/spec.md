# offline-web-app Specification

## Purpose

This capability defines the technical contracts of an offline-first web application that runs and distributes without mandatory remote services, preserves local data, and provides a self-contained HTML output.

## Requirements

### Requirement: The application works without mandatory network access
The application SHALL allow startup, navigation, gameplay, and progress access without a network connection or mandatory remote requests after the distributable HTML has been downloaded.

#### Scenario: Offline startup
- **WHEN** the user opens the distribution without Internet access
- **THEN** the interface starts and allows the user to reach a mission without relying on a CDN, remote font, or external API

#### Scenario: Remote resource unavailable
- **WHEN** an external resource does not respond
- **THEN** core functionality remains available and the application does not show a black screen or fail with an uncaught exception

### Requirement: Local progress is retained per origin and pilot
The application SHALL store progress locally, separate it by pilot, and preserve compatibility with existing storage names and formats during migrations.

#### Scenario: Reopen on the same origin
- **WHEN** the user closes and reopens the application in the same browser and origin
- **THEN** previously saved local progress is available

#### Scenario: Restricted storage
- **WHEN** the browser rejects or limits storage, including Safari private mode
- **THEN** the application handles the error safely and communicates the limitation without deliberately deleting other data

### Requirement: The production distribution is self-contained

The production distribution SHALL provide a single `index.html` with CSS, JavaScript, translations, required resources, and a local favicon embedded or otherwise represented without a mandatory adjacent-resource request.

#### Scenario: Startup favicon
- **WHEN** the user opens the application
- **THEN** the browser does not request a missing `/favicon.ico` resource

#### Scenario: Copy only the HTML
- **WHEN** the production HTML is copied to another device and opened through a compatible origin
- **THEN** the application starts and core functionality is available without copying an adjacent assets directory

#### Scenario: Validate the artifact
- **WHEN** distribution checks run
- **THEN** they fail if production depends on stylesheets, scripts, or resources outside the HTML

### Requirement: The application supports target mobile browsers

The application SHALL preserve startup through a user gesture and manage focus before hiding any splash or navigation region marked `aria-hidden`, without assuming Chromium-only behavior.

#### Scenario: Close the splash with keyboard focus
- **WHEN** the user starts the application while the splash has focus
- **THEN** focus moves to a visible application control before the splash receives `aria-hidden="true"`

#### Scenario: Close the navigation drawer with keyboard focus
- **WHEN** the user closes the drawer while a drawer control has focus
- **THEN** focus moves to the menu button before the drawer receives `aria-hidden="true"`

#### Scenario: First tap on mobile Safari
- **WHEN** the user taps to start the application for the first time
- **THEN** the splash screen disappears, the application becomes interactive, and audio or fullscreen requests occur within a browser-permitted user action

#### Scenario: Orientation change
- **WHEN** the device changes between portrait and landscape orientation
- **THEN** the interface remains usable and preserves the current activity state

### Requirement: Translations are complete and deterministic
The application SHALL generate and display Spanish and English from declarative translation sources, including dynamic text, without duplicating functional strings or exposing keys in the final interface.

#### Scenario: Build both languages
- **WHEN** the distribution is built
- **THEN** Spanish and English sources are validated and views can switch between both languages

#### Scenario: Missing key
- **WHEN** a view requests a translation that does not exist
- **THEN** validation identifies the missing key before the distribution is published

### Requirement: Quality is verified automatically
Continuous integration SHALL validate legacy script syntax, translation contracts, unit tests, self-contained builds, and E2E flows in representative browsers.

#### Scenario: Build regression
- **WHEN** a change breaks legacy syntax or introduces an external production resource
- **THEN** CI fails before the change can be integrated

#### Scenario: Browser flow
- **WHEN** the E2E suite runs
- **THEN** startup, primary navigation, and relevant persistence are checked in configured engines, including WebKit as a Safari compatibility signal
