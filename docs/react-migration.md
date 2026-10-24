# React migration boundary

The application currently starts through ordered classic scripts. The hidden `#react-root` element and `src/main.tsx` provide a typed React mount contract for incremental migration, but the bootstrap is intentionally not imported by `index.html` yet.

Legacy navigation, inline handlers, storage keys, translations, offline gameplay, and the self-contained release remain authoritative until each surface has an adapter and compatibility coverage. Future React migrations must mount only into the isolated root or an explicitly migrated surface; they must not reorder or duplicate legacy scripts.

## Integration verification

The current React core-screen migration slice was verified from a clean worktree on 2026-10-24:

- `openspec validate migrate-react-core-screens --strict`: passed.
- `npm run check`: passed; 33 legacy scripts checked, TypeScript typecheck passed, 82 unit tests passed, and the self-contained Vite distribution check passed.
- `npx playwright test`: passed; 108 tests across Chromium, Firefox, and WebKit.
- `PLAYWRIGHT_MOBILE=1 npx playwright test --project=webkit-mobile`: passed; 36 tests.
- `git diff --check`: passed.
- Chrome DevTools verification on the local Vite build confirmed dashboard and progress React hosts, 22 mission-setup controls, 12 React garage items with preview/equip delegation, and 23 React achievement items with refresh delegation. No console errors or warnings were reported, and all observed requests stayed on the local origin.

The issue remains open because the React core-screen migration is feature-flagged and legacy-owned behavior is still authoritative for gameplay, persistence, inventory, and achievement calculations. Full ownership migration is outside this slice.
