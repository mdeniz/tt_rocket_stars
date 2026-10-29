# Proposal: Identity transition and staged cutover readiness

Issue #265 turns the authentication migration rules into a reviewable runbook and automated repository contract. It explicitly rejects transparent Supabase password-hash and active-session migration, requires invitation/re-authentication/linking, preserves a read-only fallback and disabled frontend flag, and defines evidence and approvals for any future hosted cutover.

The implementation is local-only and does not access production, hosted providers, credentials, DNS, or traffic.
