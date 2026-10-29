# Proposal: Migration reconciliation and rollback rehearsal

Issue #264 adds local evidence that synthetic Supabase-to-Neon packages preserve account ownership, pilot progress, crew relationships, and versioned snapshots. The rehearsal must prove checksum reconciliation, transactional rollback, and safe recovery without connecting to production or provider accounts.

The change is intentionally local-only. It does not validate hosted Neon, Supabase exports, email delivery, sessions, or cutover traffic.
