# AGENTS.md — TT Rocket Stars

## Language
- Write all source code, comments, identifiers, commit messages, technical documentation, OpenSpec artifacts, and specifications in technical English.
- User-facing translated content is the only exception: maintain Spanish and English strings in `src/locales/`.
- Do not put product copy, implementation notes, or specifications in Spanish outside translation sources.

## Product constraints
- Educational multiplication and division game for tables 1–12; offline-first; no ads, accounts, telemetry, or mandatory network requests.
- Preserve missions, planets, rockets, coins, achievements, progress, and pilot profiles.
- Mobile/tablet first: touch interaction, both orientations, safe areas, accessibility, contrast, and reduced motion.

## Workflow
- Read `README.md`, `CHANGELOG.md`, this file, relevant code, and relevant OpenSpec artifacts before editing.
- Work in a branch and keep pull requests small; do not modify `main` without authorization.
- Describe behavioral changes, risks, and data contracts in technical English.
- Use OpenSpec for product or technical behavior changes: `openspec/changes/` for proposals and `openspec/specs/` for accepted capabilities.
- Keep `CHANGELOG.md` and propose a SemVer bump for releases.
- After CI passes and the technical review is complete, project PRs may be marked ready and approved/merged using the configured repository ruleset bypass when required.

## Package manager and commands
Use npm with the committed `package-lock.json`. Node.js 22 is required.

```bash
npm ci
npm run dev
npm run check
npm run test:unit
npx playwright install
npm run test:e2e
npm run build
```

## Architecture
- `index.html`: Vite entry point; preserve the ordered classic scripts.
- `src/styles/legacy.css`: legacy CSS; preserve cascade behavior.
- `public/legacy/scripts/00.js`–`31.js`: ordered global scripts that depend on inline handlers. Do not blindly convert them to ES modules.
- `src/locales/es.json` and `en.json`: declarative translation sources. Vite transforms `data-i18n` into `data-es` and `data-en` for compatibility; do not duplicate strings.
- `src/data/`: extract planets, missions, questions, rewards, and achievements one domain at a time; remove the legacy source only after connecting the replacement.
- `src/assets/`: extract inline SVG, audio, and images incrementally with visual tests.
- `tests/unit/`: pure logic, schemas, and contracts. `tests/e2e/`: complete flows and persistence.

The 91 CSS blocks and 32 JS blocks were separated without refactoring. Migrate incrementally: add ESM modules and global adapters, test before deleting legacy code, and do not replace working behavior with empty scaffolding.

## Critical contracts
- Keep progress independent per pilot. Preserve `localStorage`/`sessionStorage` keys, backup compatibility, and data migrations. Never delete progress as a fix.
- Safari may restrict storage and autoplay. Preserve shims and user gestures for audio/fullscreen; validate private mode on a real device.
- Start from the splash screen with one tap, without a black screen or uncaught JavaScript exceptions.
- Keep Spanish and English translations complete, including dynamic text. Use descriptive new keys; `ui.NNN` is transitional.
- Keep mathematical questions correct and within tables 1–12.
- Production must have no CDNs, remote fonts, or external resources; `dist/` must be self-contained.

## Definition of done
- `npm run check` and E2E pass, or the exact unavailable checks are documented.
- No regressions in startup, navigation, profiles, missions, settings, sound, backups, or tutorial.
- Responsive and accessible UI; correct translations; coherent changelog and version.
- Playwright WebKit is not equivalent to real iOS Safari.

## Priorities
1. Reproduce Safari splash and malformed SVG issues with tests.
2. Add E2E coverage for missions, history, backup/restore, and profiles.
3. Extract dynamic data and translations; isolate persistence.
4. Extract SVG/audio; separate UI and logic by feature.
5. Convert globals to modules gradually without breaking compatibility.

## Commit attribution
AI-authored commits must include a `Co-Authored-By` trailer identifying the agent.

Preserve data and working behavior before refactoring for aesthetics.
