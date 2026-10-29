# Design

The domain uses two independent relations: account ownership of a pilot and
membership/access within a private crew. Better Auth sessions resolve the
request identity; application services map that identity to an account and
apply predicates before repository operations. Crew membership alone never
grants pilot access.

The local Drizzle schema is the initial implementation contract. Follow-up
services must use transactions for invitations, role changes, grants,
revocations, family consent, and migration writes. Composite foreign keys and
unique constraints must preserve one pilot/progress identity and prevent
orphaned access rows.

The migration is staged: audit ownership, invite/re-authenticate accounts,
map pilots idempotently, then associate crews and explicit grants. No active
Supabase session or password hash is copied. Hosted RLS and safeguarding are
approval-gated evidence, not assumptions made from local tests.
