# Tasks

## 1. Ownership inventory and contracts

- [x] 1.1 Build an English technical ownership matrix for every global in `02.js`, `03.js`, and `32.js` that is referenced by React or inline HTML; verify each entry has one owner, a fallback disposition, and a source call site.
- [x] 1.2 Add release assertions for stable/development entrypoint separation, legacy script references, storage-key preservation, and privileged-credential absence; verify the assertions fail on an intentionally invalid fixture.
- [x] 1.3 Add unit coverage for the cutover boundary and rollback contract; verify failed validation or storage writes preserve the last valid local snapshot.

## 2. Development entrypoint cutover

- [x] 2.1 Route the selected development entrypoint through the verified React owners without changing the stable `index.html`; verify the two generated files differ in the intended ownership configuration.
- [ ] 2.2 Retire only legacy scripts proven unused by the development entrypoint and retain the stable fallback; verify startup, navigation, missions, profiles, settings, backups, and garage behavior in the flag-enabled browser path.
- [x] 2.3 Verify signed-out, offline, malformed-storage, and unavailable-cloud startup; verify local gameplay remains usable with no mandatory network request.
- [x] 2.4 Verify English/Spanish labels, keyboard/touch activation, reduced motion, audio user-gesture behavior, and responsive layout; verify no uncaught browser errors.

## 3. Release and empirical verification

- [x] 3.1 Run `npm run check`, full desktop E2E, mobile WebKit E2E, strict OpenSpec validation, and `git diff --check`; record exact results.
- [x] 3.2 Run Chrome DevTools against `index_next.html` and record URL, actions, visible results, storage evidence, console output, and network output for each cutover scenario.
- [x] 3.3 Verify `index.html` remains the previous stable artifact and document explicit promotion plus rollback; verify the release command preserves both self-contained files.
- [ ] 3.4 Update #158 and #54 with the ownership matrix, evidence, limitations, and final status only after all acceptance criteria are complete.

## Workflow follow-up

- Archive this change only after implementation, review, CI, and empirical verification pass.
- Do not promote the React runtime into stable `index.html` until the explicit release gate passes.

## Verification evidence

- Targeted Chromium cutover coverage passed, including malformed local storage, offline gameplay, localized controls, reduced-motion behavior, keyboard activation, and audio progression.
- Targeted WebKit mobile cutover coverage passed 39/39 after making the backup test wait for the reloaded typed boundary and preventing the React bottom navigation from intercepting the open legacy drawer.
- `npm run check` passed with 144 unit tests and self-contained `index.html`/`index_next.html` build validation.
- Full Chromium E2E passed 52/52 with `VITE_REACT_CORE_SCREENS=true PLAYWRIGHT_FULL=1 npx playwright test --project=chromium`.
- Full targeted WebKit mobile E2E passed 39/39 with `VITE_REACT_CORE_SCREENS=true PLAYWRIGHT_MOBILE=1 npx playwright test tests/e2e/feature-flags.spec.cjs tests/e2e/pilot-profile.spec.cjs tests/e2e/smoke.spec.cjs --project=webkit-mobile`.
- `openspec validate complete-stable-react-cutover --strict` and `git diff --check` passed; no changes were made to the tracked stable `index.html` or `index_next.html` source artifacts.
- Chrome DevTools MCP evidence is recorded in `docs/react-cutover-chrome-devtools-verification.md`; real iPhone/iPad Safari remains unavailable.
