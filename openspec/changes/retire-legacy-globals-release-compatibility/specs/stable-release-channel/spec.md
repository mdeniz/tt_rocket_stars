# Spec Delta

## MODIFIED Requirements

### Requirement: Stable and development entrypoints are finalized after build output

The build MUST write the current self-contained application before creating `index_next.html`, preserve a stable self-contained `index.html` copy, and require an explicit compatibility gate before promoting the React development runtime to the stable entrypoint.

#### Scenario: Build creates both entrypoints

- **WHEN** a production build completes
- **THEN** `dist/index_next.html` contains the current self-contained build
- **AND** `dist/index.html` remains a self-contained stable entrypoint
- **AND** both files pass the distribution validation checks

#### Scenario: Promotion is gated

- **WHEN** a release is proposed to promote the development runtime
- **THEN** the release process checks ownership parity, offline startup, storage and backup compatibility, browser coverage, and rollback evidence
- **AND** it refuses promotion while any required check is incomplete

#### Scenario: Rollback preserves the stable release

- **WHEN** a promoted development build fails a post-build compatibility check
- **THEN** the previous stable release can be restored as `index.html`
- **AND** `index_next.html` remains available for diagnosis without deleting local or cloud data
