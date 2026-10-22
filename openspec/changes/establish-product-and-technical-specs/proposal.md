# Proposal

## Why

TT Rocket Stars has a functional, deployable foundation, but its product behavior and technical boundaries are distributed across the codebase, `README.md`, and `AGENTS.md`. A structured source of truth is needed before further modularization, especially to protect offline progress, the mobile experience, and self-contained HTML distribution.

## What Changes

- Create a product specification for the educational loop, pilot profiles, progress, missions, rewards, settings, and accessibility.
- Create a technical specification for offline-first architecture, local persistence, browser compatibility, self-contained distribution, internationalization, and quality validation.
- Document the current state, contracts that must be preserved, and incremental evolution rules for the legacy code.
- Define verifiable criteria so future features can be evaluated without relying on implicit repository knowledge.

## Capabilities

### New Capabilities

- `product/gameplay-and-progress`: educational game behavior, pilots, missions, rewards, and progress preservation.
- `technical/offline-web-app`: offline execution, persistence, compatibility, self-contained distribution, translations, and quality contracts.

### Modified Capabilities

<!-- No existing specifications; this change establishes the baseline. -->

## Impact

- Affects the product and architecture documentation that will guide `public/legacy/scripts/`, `src/`, `index.html`, validation scripts, and CI/release workflows.
- Does not change public APIs, dependencies, or application behavior by itself.
- Requires no data migration: existing `localStorage`/`sessionStorage` keys and formats are treated as contracts to preserve.
