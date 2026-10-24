# Tasks

## 1. Contracts and adapters

- [x] 1.1 Add the React core-screen ownership flag and typed screen adapter contracts; verify the feature-disabled path keeps all existing legacy screens visible.
- [x] 1.2 Add legacy adapter methods for navigation, refresh, mission start, rocket actions, and achievement rendering without changing storage keys; verify adapter unit tests cover unavailable globals and successful delegation.
- [x] 1.3 Add the OpenSpec capability and update the changelog with the incremental migration boundary; verify `openspec validate --strict` passes.

## 2. Dashboard and progress

- [x] 2.1 Add React dashboard/progress screen composition around stable legacy hosts and localized labels; verify English and Spanish rendering with unit tests.
- [x] 2.2 Preserve dashboard navigation, pilot-local metrics, history, and keyboard/touch activation through adapters; verify focused Playwright tests cover offline navigation and profile switching.

## 3. Mission setup and gameplay boundary

- [x] 3.1 Add React mission setup controls that delegate table, operation, mode, duration, and start actions to the existing gameplay runtime; verify mission configuration unit tests cover all supported modes.
- [ ] 3.2 Verify timer, auto-next, audio, answer progression, and local persistence remain legacy-owned and accessible; add Playwright coverage for a representative practice and timed flow.

## 4. Garage and achievements

- [ ] 4.1 Add React garage controls that delegate part selection, purchase, equip, and coin refresh actions; verify pilot-local garage and backup compatibility with unit tests.
- [ ] 4.2 Add React achievements composition and refresh adapter; verify achievement state remains isolated per pilot and is rendered in both locales.
- [ ] 4.3 Add Playwright coverage for garage interaction, achievement visibility, and rollback to legacy ownership when the flag is disabled.

## 5. Integration verification

- [ ] 5.1 Run typecheck, unit tests, all Playwright browser projects, build, self-contained distribution checks, and `git diff --check`; record exact results in the workflow evidence.
- [ ] 5.2 Perform empirical Chrome DevTools verification for each migrated screen when available, or record the integration as unavailable without claiming it passed.
- [ ] 5.3 Review the complete issue acceptance matrix and keep the issue open if any behavior remains only partially migrated or unverified.

## Workflow follow-up

- Archive the OpenSpec change after the PR is merged and the accepted capability is synchronized.
