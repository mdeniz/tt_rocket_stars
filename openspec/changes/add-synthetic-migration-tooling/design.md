# Design

`exportSyntheticBundle` accepts only `supabase-synthetic-v1` records for account, pilot, progress snapshot, crew, crew membership, and pilot access data. Unknown fields are rejected before serialization. Auth users, passwords, access tokens, refresh tokens, sessions, and verification values have no input fields and therefore cannot enter an export.

Rows are validated for ownership references, sorted, projected to the local schema, and assigned deterministic account IDs and UUIDs derived from a SHA-256 namespace. The package contains per-table counts/checksums and a package checksum over the immutable content.

The importer uses one PostgreSQL transaction and a local `migration_imports` ledger keyed by package checksum. A dry run performs validation only. An identical replay returns `replayed`; a failure rolls back all rows. The CLI reads local JSON and uses `DATABASE_URL` only. It never contacts Supabase or Neon.
