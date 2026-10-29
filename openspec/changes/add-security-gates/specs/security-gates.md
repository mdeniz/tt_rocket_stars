# Security gates

## Requirements

### Requirement: Scan dependencies and tracked files
The repository MUST provide local and CI commands that audit the committed dependency lockfile and scan tracked files for high-confidence secrets without printing values.

#### Scenario: Local security gates run without hosted credentials
- **WHEN** a developer runs the security scripts locally
- **THEN** the secret scan is deterministic and the dependency audit uses the committed lockfile; hosted security credentials are not required.

### Requirement: Preserve existing checks
Security gates MUST be additive and MUST NOT weaken browser, build, repository, or documentation checks.

#### Scenario: CI runs security and product checks
- **WHEN** GitHub Actions evaluates a change
- **THEN** the security-gates job and existing repository/browser jobs remain enabled independently.
