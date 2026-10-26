# Browser Cloud Boundary Inventory

This inventory is the removal gate for the legacy browser cloud adapter. It
distinguishes domain consumers from the temporary provider compatibility path.

| Operation family | Domain consumer | Temporary provider path | Current provider-specific operation | Removal gate |
| --- | --- | --- | --- | --- |
| Authentication and session | `public/legacy/scripts/32.js` | `public/legacy/scripts/32.js` | Auth REST endpoints using the publishable key | Preserve invited password, recovery, token-hash, logout, and missing-config tests |
| Active pilot upload | `public/legacy/scripts/32.js`, `src/lib/react-cloud-sync.ts` | `src/lib/cloud-provider.js` through `src/lib/cloud-sync.js` | `pilots` upsert and `upsert_my_progress_snapshot` RPC | Contract tests, conflict evidence, and authenticated browser sync |
| Active pilot download | `public/legacy/scripts/32.js`, `src/lib/react-cloud-sync.ts` | `src/lib/cloud-provider.js` through `src/lib/cloud-sync.js` | `pilots` and `progress_snapshots` reads | Local-versus-remote and recovery-backup scenarios pass |
| Cloud pilot discovery | `public/legacy/scripts/32.js` | `src/lib/cloud-provider.js` through `src/lib/cloud-sync.js` | Owned `pilots` list | Account isolation and cloud-only restore scenarios pass |
| Pilot restore | `public/legacy/scripts/32.js` | `src/lib/cloud-provider.js` through `src/lib/cloud-sync.js` | Owned pilot and snapshot reads | Restore preserves local keys and backups |
| Conflict and retry | `src/lib/cloud-sync.js` | `src/lib/cloud-sync.js` | Snapshot version and provider error handling | Conflict, bounded retry, malformed payload, and offline tests pass |
| Cloud deletion | `public/legacy/scripts/32.js` | `src/lib/cloud-provider.js` through `src/lib/cloud-sync.js` | `delete_my_cloud_data` RPC | Deletion leaves local pilots, progress, and backups unchanged |
| Public configuration | `src/lib/supabase.js`, Vite entrypoint | `src/lib/supabase.js` and generated config | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, site URL | Missing/invalid/privileged configuration remains disabled |
| Local compatibility | `public/legacy/scripts/00.js`, `02.js`, `03.js`, `05.js` | Existing local stores | Existing localStorage/sessionStorage keys and backup envelopes | Storage and backup compatibility checks pass |

The active browser contract is `src/lib/cloud-boundary.ts`. Provider-specific
calls are isolated in `src/lib/cloud-provider.js`; consumers and the sync domain
layer use only domain operation names. The provider path is still a compatibility
implementation because the deployment has no trusted
application transport or hosted backend in this repository. The browser may use
only the publishable Supabase configuration and the authenticated user context.
Administrative credentials and provider-management operations are out of scope
for the browser and must remain in a trusted operator or server environment.
