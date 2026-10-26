# Spec Delta

## ADDED Requirements

### Requirement: Release validation enforces ownership and rollback gates

The release workflow SHALL verify the selected entrypoint, compatibility checks,
and rollback evidence before allowing a stable promotion.

#### Scenario: Incomplete cutover cannot promote

- **WHEN** ownership, browser, offline, storage, or artifact validation is incomplete
- **THEN** the release workflow rejects stable promotion
- **AND** the existing stable `index.html` remains untouched

#### Scenario: Complete cutover can promote

- **WHEN** all required automated and Chrome DevTools checks pass
- **THEN** the workflow can promote the versioned self-contained development artifact
- **AND** it preserves the stable artifact as a recoverable release
