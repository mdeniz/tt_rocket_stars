# Proposal: Bootstrap React and strict TypeScript

Introduce a typed React mount contract alongside the ordered legacy runtime. This change creates migration infrastructure without replacing legacy navigation, gameplay, persistence, translations, or the self-contained Vite release.

## Scope

- Add strict TypeScript checking and the minimal React runtime dependencies.
- Add an inert isolated mount point and typed bootstrap API.
- Preserve the current legacy entry path until later feature migrations provide adapters and tests.
