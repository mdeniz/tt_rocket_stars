# Proposal

## Why

Cloud data access is currently split between browser Supabase calls, provider-specific
SQL migrations, test fixtures, and operational documentation. As the pilot, crew,
membership, access, and snapshot model grows, this makes schema drift and accidental
provider coupling harder to detect without weakening the existing RLS and offline-first
contracts.

## What Changes

- Inventory every current data-access, migration, test, CI, and operational entry point.
- Compare viable TypeScript data-access options for a small trusted backend or Edge
  Function boundary and record the decision with explicit trade-offs.
- Define typed domain repositories for cloud pilots, crews, memberships, pilot access,
  and versioned progress snapshots; keep provider-specific details outside UI code.
- Establish deterministic migration validation and a documented local, CI, and Supabase
  application workflow, including failure recovery and schema-drift checks.
- Preserve PostgreSQL RLS, security-definer functions, optimistic snapshot versions,
  invited authentication, browser-safe public configuration, and local-first gameplay.
- Keep the first implementation incremental: no production data migration or runtime
  cutover occurs until the boundary and rollback evidence are complete.

## Capabilities

### New Capabilities

- `technical/typed-data-access`: Typed server-side domain access and reproducible,
  provider-isolated schema migration workflow for cloud data.

### Modified Capabilities

None. Existing cloud synchronization and crew-access behavior remains unchanged while
the provider boundary is introduced behind compatible contracts.

## Impact

- Affected code includes `src/lib/supabase.js`, `src/lib/cloud-sync.js`, the typed cloud
  adapters, Supabase migrations, schema tests, CI checks, and new trusted backend or Edge
  Function modules.
- The browser continues to receive only the publishable Supabase configuration and never
  receives service-role credentials.
- Existing local storage keys, backup envelopes, pilot identifiers, and cloud payloads
  remain compatibility contracts.
- Dependency adoption, if approved by the decision record, is limited to the trusted
  data-access boundary and migration tooling; it is not bundled into the Vite client.
