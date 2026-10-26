# Persistence contracts

TT Rocket Stars uses a local-first persistence boundary. The boundary is shared by the ordered legacy scripts and the current cloud synchronization runtime without changing the established storage names.

## Local profile contract

The profile collection is stored under `tt-rocket-profiles-v1`. Each profile has a stable `id`, a display `name`, a supported `language`, a numeric `createdAt`, and an opaque `payload` object. Unknown payload fields are retained so future versions and legacy game data survive validation.

The active profile reference remains `tt-rocket-active-profile-v1`. The active profile payload continues to use the existing keys:

- `cosmotablas-v2`
- `cosmotablas-history-v1`
- `tt-rocket-garage-v1`
- `tt-rocket-backups-v1`

Profile switching captures the current payload before applying the selected profile payload. A malformed profile collection is ignored without deleting unrelated storage.

## Storage fallback

The adapter wraps the existing `localStorage` compatibility shim and has an in-memory fallback for unavailable or throwing storage implementations. This keeps the game playable when browser storage is blocked, while making the fallback non-persistent by design.

## Backup contract

Backups use the versioned envelope `{ format: 'tt-rocket-stars-backup', version: 1, createdAt, payload }`. Every required payload value must be either `null` or valid JSON. Validation happens before restore and invalid imports leave the current state unchanged. Automatic pre-restore and pre-reset backups remain local to the current browser.

## Cloud contract

Cloud snapshots contain `localId`, `name`, `avatar`, `language`, `payload`, `updatedAt`, and optional `version`. The cloud adapter validates snapshots before comparison or application. Invalid, missing, or unavailable remote data produces a failed synchronization result and never replaces the local pilot. Version metadata remains in `tt-rocket-cloud-sync-v1` for optimistic conflict handling.

## Migration guarantee

This boundary is additive. It does not rename or remove existing storage keys, rewrite unknown payload fields, require authentication, or require network access for local gameplay. Future schema changes must add a migration and compatibility fixture before changing a persisted contract.

## React ownership boundary

When `reactCoreScreens` is enabled explicitly, React profile creation and
switching use the typed persistence coordinator. It validates the complete
profile collection, captures the current payload before switching, applies the
target payload only after validation, and updates the existing active-pilot and
language keys. A failed operation leaves the current local state unchanged.

The default release keeps the coordinator disabled and continues using the
legacy profile runtime. The legacy aliases remain available as a rollback path;
this migration does not remove the ordered profile script or change cloud
synchronization ownership.

## React inventory ownership boundary

When `reactCoreScreens` is enabled explicitly, React inventory actions use a
typed coordinator over the active pilot's `tt-rocket-garage-v1` payload. The
coordinator validates catalog entries, coins, owned parts, equipped parts,
support fleet limits, and compatible future fields before writing. Preview and
category state remain local UI state; purchase and equip operations update the
active profile payload atomically and refresh the legacy visual mirror.

Unknown parts, malformed payloads, insufficient coins, full support fleets, and
storage failures fail closed without deleting the previous valid inventory.
The legacy inventory adapter remains selected when the flag is disabled, so
published behavior and backup compatibility are unchanged.
