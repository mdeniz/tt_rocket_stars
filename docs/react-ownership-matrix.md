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

## Machine-readable inventory

The JSON block below is the reviewable source for static retirement checks. Each
row has exactly one current typed owner, one fallback owner, and an explicit
retirement decision. A `retain` decision is intentional: the source remains a
required compatibility dependency until its stated gate is complete.

```json
{
  "schemaVersion": 1,
  "change": "retire-legacy-globals-release-compatibility",
  "stableEntrypoint": "index.html",
  "developmentEntrypoint": "index_next.html",
  "rows": [
    {
      "id": "core-navigation",
      "typedOwner": "TTCoreScreensAdapter/ReactCoreScreens",
      "legacySources": ["navigate", "public/legacy/scripts/03.js", "public/legacy/scripts/26.js"],
      "inlineConsumers": ["navigate(...)"],
      "fallbackOwner": "legacy navigation globals",
      "decision": "retain",
      "removalGate": "all route consumers and disabled-flag rollback pass"
    },
    {
      "id": "mission-gameplay",
      "typedOwner": "TTGameplayAdapter/ReactMissionSetupHost/ReactMissionPlayer",
      "legacySources": ["start", "finish", "submit", "nextQuestion", "public/legacy/scripts/03.js"],
      "inlineConsumers": ["start()", "nextQuestion()", "submit()", "finish()"],
      "fallbackOwner": "legacy mission runtime",
      "decision": "retain",
      "removalGate": "all modes, timers, auto-next, audio, rewards, history, and rollback pass"
    },
    {
      "id": "pilot-profiles",
      "typedOwner": "TTPersistenceBoundary.pilots/TTPilotAdapter",
      "legacySources": ["TTProfiles", "TTSwitchProfileInPlace", "public/legacy/scripts/02.js"],
      "inlineConsumers": ["TTProfiles.show()", "TTProfiles.renameActive()", "TTProfiles.deleteActive()"],
      "fallbackOwner": "legacy profile persistence",
      "decision": "retain",
      "removalGate": "profile lifecycle, backup, settings, cloud restore, and disabled-flag rollback pass"
    },
    {
      "id": "mission-persistence",
      "typedOwner": "TTPersistenceBoundary.mission",
      "legacySources": ["TTLocalStore", "cosmotablas-v2", "cosmotablas-history-v1", "public/legacy/scripts/03.js"],
      "inlineConsumers": ["mission answer and result handlers"],
      "fallbackOwner": "legacy mission persistence",
      "decision": "retain",
      "removalGate": "typed parity, malformed-payload rollback, backup round-trip, and no enabled-path legacy writes pass"
    },
    {
      "id": "inventory-and-rocket",
      "typedOwner": "TTPersistenceBoundary.inventory/ReactGaragePanel",
      "legacySources": ["TTInventoryAdapter", "TTRocketInventoryBridge", "renderGarage", "public/legacy/scripts/03.js"],
      "inlineConsumers": ["garageAction(...)", "previewPart(...)"],
      "fallbackOwner": "legacy rocket inventory runtime",
      "decision": "retain",
      "removalGate": "pilot isolation, coins, equipment, preview, backup, and rollback pass"
    },
    {
      "id": "achievements",
      "typedOwner": "TTAchievementAdapter/ReactAchievementsPanel",
      "legacySources": ["getAwards", "renderDashboard", "public/legacy/scripts/03.js"],
      "inlineConsumers": ["achievement refresh controls"],
      "fallbackOwner": "legacy achievement renderer",
      "decision": "retain",
      "removalGate": "all achievement definitions, locales, malformed data, and rollback pass"
    },
    {
      "id": "backups",
      "typedOwner": "TTPersistenceBoundary.backups/TTBackupControls",
      "legacySources": ["createManualBackup", "restoreBackup", "importBackup", "exportBackup", "resetWithBackup", "public/legacy/scripts/05.js"],
      "inlineConsumers": ["createManualBackup()", "restoreBackup(...)", "importBackup(event)", "exportBackup()", "resetWithBackup()"],
      "fallbackOwner": "legacy backup runtime",
      "decision": "retain",
      "removalGate": "versioned envelope, recovery-before-replacement, import/export, and rollback pass"
    },
    {
      "id": "cloud-synchronization",
      "typedOwner": "TTPersistenceBoundary.cloud/TTCloudSyncAdapter",
      "legacySources": ["TTAuth", "TTCloudSync", "TTCloudSyncAdapter", "restoreCloud", "public/legacy/scripts/32.js"],
      "inlineConsumers": ["cloud settings controls"],
      "fallbackOwner": "legacy optional cloud runtime",
      "decision": "retain",
      "removalGate": "authenticated sync, deletion, conflicts, redirect, RLS, and no privileged credential pass"
    },
    {
      "id": "settings-and-language",
      "typedOwner": "TTSettingsAdapter/React settings host",
      "legacySources": ["setLanguage", "TTSettingsAdapter", "public/legacy/scripts/04.js", "public/legacy/scripts/26.js"],
      "inlineConsumers": ["setLanguage(...)", "toggleLanguageMenu()"],
      "fallbackOwner": "legacy settings categories",
      "decision": "retain",
      "removalGate": "all settings panels, English/Spanish labels, and disabled-flag fallback pass"
    },
    {
      "id": "audio-and-splash",
      "typedOwner": "TTAudio/TTFullscreenAdapter/React shell entry",
      "legacySources": ["TTEnterGame", "TTAudio", "TTAccessibility", "public/legacy/scripts/06.js", "public/legacy/scripts/16.js"],
      "inlineConsumers": ["launch splash activation"],
      "fallbackOwner": "legacy splash and audio runtime",
      "decision": "retain",
      "removalGate": "first tap, reduced motion, audio gesture, fullscreen, and restricted-storage checks pass"
    },
    {
      "id": "local-and-session-storage",
      "typedOwner": "typed persistence contracts",
      "legacySources": ["TTLocalStore", "TTSessionStore", "protected storage keys"],
      "inlineConsumers": ["all local-first domains"],
      "fallbackOwner": "legacy storage adapters",
      "decision": "never-remove",
      "removalGate": "only a future versioned migration may replace this contract"
    }
  ]
}
```

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
