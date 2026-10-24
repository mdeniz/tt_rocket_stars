# Delta for technical/offline-web-app

## MODIFIED Requirements

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
