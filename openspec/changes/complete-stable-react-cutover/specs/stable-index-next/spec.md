# Spec Delta

## ADDED Requirements

### Requirement: Development cutover does not mutate the stable entrypoint

The deployment SHALL publish the React cutover only through `index_next.html`
until an explicit release promotion is performed.

#### Scenario: Development deployment preserves the stable artifact

- **WHEN** a development deployment builds a new React-owned entrypoint
- **THEN** `index_next.html` contains the new self-contained build
- **AND** `index.html` remains the previous stable self-contained artifact

#### Scenario: Explicit promotion updates the stable artifact

- **WHEN** an authorized release promotion is requested after all verification gates pass
- **THEN** the selected `index_next.html` artifact becomes the new stable `index.html`
- **AND** the promotion records the release version and source revision
