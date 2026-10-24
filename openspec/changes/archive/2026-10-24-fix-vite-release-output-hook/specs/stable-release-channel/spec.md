## ADDED Requirements

### Requirement: Stable and development entrypoints are finalized after build output

The build MUST write the current self-contained application before creating
`index_next.html`, and MUST preserve a stable self-contained `index.html` copy.

#### Scenario: Build creates both entrypoints

- **WHEN** a production build completes
- **THEN** `dist/index_next.html` contains the current self-contained build
- **AND** `dist/index.html` remains a self-contained stable entrypoint
- **AND** both files pass the distribution validation checks
