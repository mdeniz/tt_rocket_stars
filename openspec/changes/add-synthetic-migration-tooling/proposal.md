# Proposal: Synthetic migration tooling

Issue #263 needs a repeatable rehearsal boundary for the Supabase-to-Neon transition without reading production systems. This change adds a synthetic input contract, an explicit privacy allowlist, deterministic identity mapping, checksums, row counts, dry-run reporting, and a transactional local PostgreSQL importer with durable replay detection.

The tooling does not migrate Supabase password hashes, active sessions, provider credentials, production data, DNS, traffic, or hosted databases. Reconciliation and approval-gated cutover remain follow-up work.
