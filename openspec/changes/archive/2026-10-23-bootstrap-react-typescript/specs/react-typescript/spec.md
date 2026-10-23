# React and TypeScript bootstrap

## ADDED Requirements

### Requirement: Isolated React mount
The application MUST expose a hidden `#react-root` element that is independent from the legacy DOM and MUST NOT replace the legacy startup entry point.

#### Scenario: Legacy startup remains authoritative
- **WHEN** the application loads
- **THEN** the ordered legacy scripts remain the only startup scripts
- **AND** the React root does not render or alter gameplay before a later migration explicitly mounts a surface.

### Requirement: Strict typed bootstrap
The repository MUST provide a strict, no-emit TypeScript configuration and a typed React mount function that safely no-ops when the root is absent.

#### Scenario: Type checking
- **WHEN** the project runs its check command
- **THEN** the TypeScript bootstrap is checked with strict diagnostics
- **AND** no generated JavaScript files are written to the source tree.

### Requirement: Compatibility release
The migration foundation MUST preserve the self-contained Vite release and must not add runtime CDNs or external fonts.

#### Scenario: Production build
- **WHEN** the project runs the production build
- **THEN** the release remains a single self-contained HTML document
- **AND** legacy script order and offline assets remain available.
