# Tasks

## 1. Validate the product baseline

- [ ] 1.1 Review `product/gameplay-and-progress` with product stakeholders and confirm coverage of mathematics practice, pilots, progress, rewards, settings, backups, and mobile use; verify that every requirement has executable or reviewable scenarios.
- [x] 1.2 Map existing mission, profile, save/restore, and tutorial flows to the product scenarios; verify the map with `npm run test:e2e` and record gaps without inventing behavior. See `docs/product-flow-map.md`.
- [x] 1.3 Define the compatible backup format and progress migration rules from current behavior; verify them with unit tests and valid/invalid restore tests before changing storage. See `docs/persistence-contracts.md`.

## 2. Validate the technical contracts

- [x] 2.1 Audit the production artifact against `technical/offline-web-app`; verify the absence of remote dependencies and self-contained output with `npm run build` and `node scripts/check-dist.cjs`.
- [x] 2.2 Cover startup, first tap, restricted storage, orientation changes, and persistence with browser flows; verify the configured suite with `npm run test:e2e` and document which WebKit behavior is not equivalent to iOS Safari.
- [x] 2.3 Confirm translation coverage and legacy-script contracts; verify with `npm run check:legacy`, unit tests, and the complete build.

## 3. Integrate the specifications into project workflow

- [x] 3.1 Review `README.md` and `AGENTS.md` to link the OpenSpec catalog and maintain one operational source of truth; verify that documented commands and paths exist.
- [x] 3.2 Convert every future extraction or behavior change into an OpenSpec proposal with requirements and scenarios; verify the process with `openspec status` and `openspec validate`.
- [x] 3.3 Run final validation for this baseline and resolve inconsistencies across proposal, specs, design, and tasks; verify with `openspec validate establish-product-and-technical-specs --strict`.

## Workflow follow-up

- Archive the change after product and technical review approve both capabilities; verify that the specs are present under `openspec/specs/`.
- Keep the open questions about the stable backup format and minimum iOS version outside implementation until an explicit decision is made.
