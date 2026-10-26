# React Cutover Ownership Matrix

This matrix is the retirement contract for the React development entrypoint. A
legacy global may be removed only after its row has a React owner, an explicit
fallback, and a verified source call site.

| Global or operation | Legacy source | React owner | Consumers / source call sites | Fallback disposition |
| --- | --- | --- | --- | --- |
| `TTProfiles.read`, `active`, `choose`, `create` | `public/legacy/scripts/02.js` | `createReactPilotPersistence` | `src/lib/react-pilot-persistence.ts`, `src/components/PilotSelector.tsx` | Keep `TTProfiles` for the stable entrypoint and disabled React flag |
| `tt-rocket-profiles-v1`, `tt-rocket-active-profile-v1` | `public/legacy/scripts/02.js` | `createReactPilotPersistence` | `src/lib/react-pilot-persistence.ts`, `src/lib/persistence-runtime.js` | Preserve both keys and the legacy profile envelope for rollback |
| `TTProfiles.sync` | `public/legacy/scripts/02.js` | `createReactPilotPersistence` plus persistence boundary | `src/lib/react-gameplay-persistence.ts`, `src/lib/react-backup-persistence.ts`, `src/lib/shell-adapters.ts` | Keep legacy profile snapshot sync until all inline writers are retired |
| `TTProfiles.restoreCloud` | `public/legacy/scripts/02.js` | `createReactCloudSyncBoundary` | `public/legacy/scripts/32.js`, `src/lib/react-cloud-sync.ts` | Keep cloud restore bridge; fail closed when cloud is unavailable |
| `cosmotablas-v2`, `cosmotablas-history-v1`, `tt-rocket-garage-v1`, `tt-rocket-backups-v1` | `public/legacy/scripts/02.js`, `03.js` | Typed pilot, mission, inventory, and backup persistence adapters | `src/lib/persistence-runtime.js`, `src/lib/react-*-persistence.ts` | Preserve keys, envelopes, unknown fields, and last valid local snapshots |
| `TTProfiles.renameActive`, `deleteActive`, `remove` | `public/legacy/scripts/02.js` | React pilot persistence actions | `src/components/PilotSelector.tsx`, `index.html` inline handlers | Retain legacy profile controls for stable rollback |
| `navigate` and screen refresh functions | `public/legacy/scripts/03.js` | `createCoreScreensAdapter` | `src/lib/shell-adapters.ts`, `src/shell.tsx`, `index.html` inline handlers | Retain legacy navigation until every screen has a React owner |
| Mission setup globals: `toggle`, `pick`, `choose`, `chooseDuration`, `start` | `public/legacy/scripts/03.js` | `createGameplayAdapter` / `createMissionPersistence` | `src/components/MissionSetup.tsx`, `src/lib/shell-adapters.ts` | Typed adapter delegates to legacy gameplay while the fallback is enabled |
| Mission progression globals: `nextQuestion`, `submit`, `finish`, `requestExit`, `cancelExit`, `confirmExit` | `public/legacy/scripts/03.js` | React mission player and gameplay persistence | `src/components/MissionPlayer.tsx`, `src/lib/react-gameplay.ts` | Keep legacy player as the rollback path; no script retirement yet |
| Rocket inventory globals: `selectFamily`, `setGarageCat`, `previewPart`, `garageAction`, `renderGarage` | `public/legacy/scripts/03.js` | `createReactInventoryPersistence` | `src/lib/react-inventory-persistence.ts`, `src/shell.tsx` | Keep `TTRocketInventoryBridge` and legacy garage rendering |
| Achievement refresh and evaluation | `public/legacy/scripts/03.js` | React achievement adapter and evaluator | `src/lib/react-achievements.ts`, `src/shell.tsx` | Keep `renderAwards` for the stable fallback |
| `TTCloudSyncAdapter` and authentication controls | `public/legacy/scripts/32.js` | `createReactCloudSyncBoundary` | `src/lib/react-cloud-sync.ts`, `src/shell.tsx` | Optional boundary; unavailable cloud must never block local play |
| Password session and cloud deletion controls | `public/legacy/scripts/32.js` | React cloud boundary contract | `src/lib/react-cloud-sync.ts`, `index.html` cloud panel | Keep the legacy provider bridge until production authentication evidence is complete |

## Stable-only legacy globals

The following remain intentionally legacy-owned for this cutover slice: the
inline event-handler surface in `index.html`, the ordered runtime in
`public/legacy/scripts/00.js`–`31.js`, and the provider-specific implementation
in `public/legacy/scripts/32.js`. The development flag selects typed adapters,
but it does not authorize deleting a script without a separate ownership row and
browser evidence.

## Retirement rule

The next removable unit must be a whole legacy boundary, not an individual
function copied into React. Before removal, update this matrix, add a failing
fixture for the old dependency, run the full browser matrix, and verify the
stable artifact remains recoverable.
