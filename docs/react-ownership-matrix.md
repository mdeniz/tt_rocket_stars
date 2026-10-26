# React ownership matrix

This matrix is the release-compatibility inventory for issue #158. It records
the selected development path, the typed React boundary, and every legacy
global that remains a compatibility dependency. A legacy global is not safe to
remove until its row has a replacement, browser evidence, and a rollback
decision.

| Domain | React owner when `reactCoreScreens` is enabled | Legacy global or source still loaded | Current responsibility | Removal gate |
| --- | --- | --- | --- | --- |
| Core navigation and screen visibility | `TTCoreScreensAdapter` and `ReactCoreScreens` | `navigate`, ordered scripts `03.js` and `26.js` | Keeps legacy routes, inline handlers, and rollback navigation available | Migrate every route consumer and verify disabled-flag startup and rollback |
| Mission setup and gameplay | `TTGameplayAdapter`, `ReactMissionSetupHost`, and `ReactMissionPlayer` | `start`, mission DOM handlers, `public/legacy/scripts/03.js` | Legacy gameplay remains the fallback and compatibility mirror for existing handlers | Complete parity audit for every mode, timer, auto-next, reward, audio, and history path |
| Pilot profiles | `TTPersistenceBoundary.pilots` and `TTPilotAdapter` | `TTProfiles`, `TTSwitchProfileInPlace`, `public/legacy/scripts/02.js` | Preserves profile keys, active-pilot switching, and legacy integrations | Remove direct legacy consumers after profile, backup, cloud, and settings flows pass |
| Mission facts and history | `TTPersistenceBoundary.mission` and React evaluators | `cosmotablas-v2`, `cosmotablas-history-v1`, legacy writes in `03.js` | Preserves payload shapes and provides the fallback write path | Prove no enabled-path write reaches the legacy source of truth and retain migration checks |
| Inventory and rocket state | `TTPersistenceBoundary.inventory` and `ReactGaragePanel` | `TTInventoryAdapter`, `TTRocketInventoryBridge`, rocket state in `03.js` | Preserves coins, owned parts, equipment, preview, and legacy SVG refresh | Complete pilot isolation, backup round-trip, and rollback audit |
| Achievements | `TTAchievementAdapter` and `ReactAchievementsPanel` | Legacy achievement renderer in `03.js` and `TTAchievementAdapter` fallback | Computes localized results from pilot-local facts and history while retaining rollback | Verify all achievement definitions and remove the duplicate renderer only after release audit |
| Backups | `TTPersistenceBoundary.backups` and typed backup controls | `TTBackupControls`, backup handlers in `05.js` | Preserves versioned envelopes, recovery-before-replacement, import/export, and reset | Keep legacy handlers only until stable release promotion and rollback checks are complete |
| Cloud synchronization | `TTPersistenceBoundary.cloud` and `TTCloudSyncAdapter` bridge | `TTCloudSync`, `TTAuth`, `TTProfiles.restoreCloud`, `32.js` | Keeps optional authentication, local-first sync, and cloud restore fail-closed | Verify authenticated sync, deletion, conflicts, redirect behavior, and no service-role exposure |
| Settings and language | React settings host plus `TTSettingsAdapter` | `setLanguage`, `TTSettingsAdapter`, `04.js` and `26.js` | Preserves translated settings panels and legacy category handlers | Migrate every settings panel and verify both locales before removing legacy handlers |
| Audio and splash entry | React shell entry plus `TTAudio` and `TTFullscreenAdapter` | `TTEnterGame`, `TTAudio`, `TTAccessibility`, `06.js`, `16.js` | Preserves user-gesture audio/fullscreen behavior and Safari-sensitive startup | Verify first tap, reduced motion, audio, fullscreen, and restricted storage on target devices |
| Local storage and session storage | Typed persistence contracts | `TTLocalStore`, `TTSessionStore`, existing storage keys | Compatibility layer for all local-first payloads and session gates | No key rename or deletion; remove only after artifact and migration tests prove equivalent behavior |

The protected local keys are `tt-rocket-profiles-v1`,
`tt-rocket-active-profile-v1`, `cosmotablas-v2`, `cosmotablas-history-v1`,
`tt-rocket-garage-v1`, and `tt-rocket-backups-v1`.

## Entrypoint contract

- `index.html` is the stable published release and keeps the React ownership
  flag disabled.
- `index_next.html` is the development artifact and enables the React core
  path for controlled verification.
- Both artifacts remain self-contained and preserve the ordered legacy scripts
  until the removal gates above are complete.
- Disabling `reactCoreScreens` must restore the legacy path without changing
  local storage, session storage, backups, or cloud state.

## Evidence required before retirement

For each row, the workflow must record unit and browser results, the running
application URL, the user action, the visible result, console errors, network
requests, and rollback behavior. Playwright WebKit is a compatibility signal;
it is not evidence of real iOS Safari equivalence.
