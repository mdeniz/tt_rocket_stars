# Identity transition readiness

## Requirements

### Requirement: Preserve identity safety
The transition MUST require invitation, re-authentication, and explicit account linking. It MUST NOT copy Supabase password hashes or active sessions.

#### Scenario: Existing user transitions safely
- **WHEN** an existing Supabase identity is selected for migration
- **THEN** the user is invited, re-authenticates, sets a new Better Auth password, explicitly links the intended Account, and receives no copied password hash or active session.

### Requirement: Gate hosted cutover
The transition MUST preserve a disabled frontend flag, a read-only legacy fallback, local reconciliation evidence, and explicit staging/canary/cutover approvals with recovery evidence.

#### Scenario: Local readiness does not switch traffic
- **WHEN** repository checks run without hosted credentials
- **THEN** local gameplay remains available, hosted operations remain pending, and no production system or traffic is changed.
