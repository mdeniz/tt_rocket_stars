## ADDED Requirements

### Requirement: React owns flagged achievement rendering

When the `reactCoreScreens` flag is enabled, the React achievements surface
MUST evaluate and render pilot-local achievement state without reading legacy
achievement DOM or invoking legacy achievement rendering actions.

#### Scenario: Render achievements from local pilot data

- **GIVEN** the React core flag is enabled and a pilot has local fact and
  mission history data
- **WHEN** the achievements screen is displayed or refreshed
- **THEN** React renders the localized achievement records from the typed
  evaluator
- **AND** no legacy achievement DOM is required for the result.

#### Scenario: Malformed local data fails closed

- **GIVEN** the React core flag is enabled and local achievement input is
  malformed
- **WHEN** the achievements screen is displayed
- **THEN** React renders a safe locked state without throwing or deleting local
  progress.
