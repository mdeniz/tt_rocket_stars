# Spec Delta

## MODIFIED Requirements

### Requirement: The production distribution is self-contained
The production distribution SHALL provide a single `index_next.html` with CSS, JavaScript, translations, and required resources embedded, without requiring adjacent files to run the application. A separate root `index.html` compatibility entry MAY redirect to the next artifact.

#### Scenario: Copy only the HTML
- **WHEN** the production `index_next.html` is copied to another device and opened through a compatible origin
- **THEN** the application starts and core functionality is available without copying an adjacent assets directory

#### Scenario: Validate the artifact
- **WHEN** distribution checks run
- **THEN** they fail if `index_next.html` depends on stylesheets, scripts, or resources outside the HTML
