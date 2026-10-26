# Typed Data-Access Inventory

This inventory records the current data-access entry points before introducing a
trusted typed boundary. It is intentionally explicit about browser, compatibility,
database, test, CI, and operational responsibilities.

| Area | Current entry point | Runtime | Responsibility | Compatibility/security constraint |
| --- | --- | --- | --- | --- |
| Public configuration | `src/lib/supabase.js` | Vite browser bundle | Validate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; create the publishable client | Missing or invalid configuration disables cloud access; privileged keys are rejected |
| Cloud compatibility client | `src/lib/cloud-sync.js` | Browser legacy runtime | Upload/download/list/restore pilot snapshots and retry transient failures | Uses the publishable client only; local-first fallback and recovery backups remain mandatory |
| React cloud boundary | `src/lib/react-cloud-sync.ts` | Vite browser bundle | Expose typed fail-closed calls to the legacy cloud adapter | Must not import an ORM or service-role client |
| Legacy cloud bridge | `public/legacy/scripts/32.js` | Ordered browser script | Owns the current REST/RPC compatibility implementation and auth-session lookup | Retained until consumers are migrated and RLS evidence is repeated |
| Local persistence | `src/lib/react-pilot-persistence.ts`, `src/lib/persistence-contracts.ts` | Vite browser bundle | Validate pilot, payload, backup, and cloud snapshot contracts | Preserve existing keys, opaque fields, pilot identifiers, and offline behavior |
| Legacy local persistence | `public/legacy/scripts/00.js`, `02.js`, `03.js`, `05.js` | Ordered browser scripts | Storage adapters, profile lifecycle, mission progress, backups, and reset | Compatibility fallback remains required while React ownership is reversible |
| Pilot/profile tests | `tests/unit/*persistence*`, `tests/e2e/pilot-profile.spec.cjs` | Node/Playwright | Validate profile isolation, malformed storage, backups, and offline operation | Tests assert existing storage key names and payload compatibility |
| Cloud tests | `tests/unit/cloud-sync.test.cjs`, `tests/unit/react-cloud-sync.test.cjs`, `tests/e2e/cloud-fixture.cjs`, `tests/e2e/cloud-sync.spec.cjs` | Node/Playwright | Simulate auth, upload/download, conflicts, provider failures, and deletion | Fixtures must not contain service-role credentials or imply hosted RLS proof |
| Schema tests | `tests/unit/supabase-schema.test.cjs`, `docs/supabase-schema.md` | Node | Check tables, grants, RLS, security-definer functions, and migration documentation | SQL security behavior remains independently testable and reviewable |
| Migration source | `supabase/migrations/*.sql` | Supabase/PostgreSQL | Ordered schema, RLS policies, grants, triggers, and RPC functions | Current checked-in SQL history is the authoritative source until a replacement is proven |
| CI validation | `.github/workflows/ci.yml` | GitHub Actions | Node 22 checks, unit/build checks, and browser matrix | Schema/migration validation must be added without weakening browser or security jobs |
| Release validation | `.github/workflows/pages.yml`, `.github/workflows/release.yml`, `scripts/check-cutover.cjs`, `scripts/check-dist.cjs` | GitHub Actions/Node | Build self-contained stable and development artifacts and promotion/rollback | No server-only package may enter `index.html` or `index_next.html` |
| Operational provider access | Supabase Dashboard/CLI and documented provider procedures | Trusted operator context | Apply migrations, configure Auth/SMTP, inspect RLS, and recover failed changes | Service-role credentials remain operator/server-only and are never committed |

## Current access map

The browser currently accesses only the publishable Supabase client through the legacy
cloud bridge. Direct provider-specific calls are concentrated in `32.js` and
`cloud-sync.js`; the React boundary delegates to that bridge. Database writes that
change snapshots use the authenticated RPC, while pilot metadata still has a legacy
table-backed path. Crew tables are read-only to authenticated clients and protected by
RLS policies and security-definer helper functions.

The future trusted boundary must sit between UI/domain code and these provider calls.
It must not move local persistence into the database or make cloud access a gameplay
requirement.
