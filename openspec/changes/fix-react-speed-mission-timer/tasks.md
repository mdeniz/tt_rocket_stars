# Tasks

## 1. Specification and state-machine coverage

- [x] 1.1 Add unit coverage proving speed timer advancement reaches completion at 60 seconds and preserves the existing reward semantics.
- [x] 1.2 Add the React core-screen spec delta for visible speed countdown and timeout completion.

## 2. React implementation

- [x] 2.1 Run the React mission timer effect for both timed and speed modes.
- [x] 2.2 Preserve the typed completion persistence, duplicate protection, and disabled-flag legacy fallback.

## 3. Verification

- [x] 3.1 Add Chromium E2E coverage for speed countdown progression and timeout completion.
- [x] 3.2 Verify timed missions, legacy rollback, English/Spanish labels, offline play, and accessibility regressions.
- [x] 3.3 Run `npm run check`, focused E2E, production build, and Chrome DevTools empirical verification with no console or external network errors.
- [ ] 3.4 Update issue #142 with evidence; archive the OpenSpec change only after CI and review pass.
