# Design

## Context

The application starts from a historical prototype with 32 ordered classic scripts, legacy CSS, declarative translations, and a Vite build that produces a self-contained `dist/index.html`. The product constraints are documented in `AGENTS.md`; this proposal turns them into verifiable contracts without requiring an immediate rewrite.

## Goals / Non-Goals

**Goals:**

- Maintain separate sources of truth for product behavior and technical contracts.
- Make every requirement traceable to an E2E test, unit test, artifact check, or explicit manual review.
- Guide incremental migration from globals and classic scripts to modules without changing user or data contracts.
- Use the specifications as the basis for future change proposals and release reviews.

**Non-Goals:**

- Rewrite the legacy logic, change the storage format, or add a backend now.
- Treat WebKit compatibility as a guarantee of real iOS Safari compatibility.
- Define implementation details that can change without altering observable behavior.

## Decisions

### Separate product and platform

Create two cohesive capabilities: `product/gameplay-and-progress` describes the pilot experience, while `technical/offline-web-app` describes system boundaries. A future educational feature can then change the former without reopening the entire architecture, and a build improvement can change the latter without inventing game requirements.

Alternative rejected: one broad application specification. It would be difficult to maintain and would mix acceptance criteria with infrastructure decisions.

### Treat existing storage as a contract

Existing keys, backup formats, and per-pilot separation are observable compatibility requirements. Future migrations must define an explicit read/write strategy and tests before removing a format.

Alternative rejected: clean or rename storage during modularization. That risks progress loss and contradicts the priority of preserving data.

### Keep the HTML distribution self-contained

Production output remains validated as one HTML file, while development keeps the structure convenient for Vite and Playwright. Artifact validation is a release guardrail, not a reason to couple the internal architecture to a single bundler.

Alternative rejected: publish an asset directory or use CDNs. That increases offline failures and complicates iPhone usage.

### Validate in layers

Each change must use the check closest to its risk: unit tests for pure contracts, E2E for flows, build validation for distribution, and WebKit/real Safari for platform restrictions. CI WebKit is a useful signal, not a substitute for iOS testing.

## Risks / Trade-offs

- [The prototype contains implicit global behavior] → Preserve script order and add tests before extracting each domain.
- [Safari restricts storage, audio, and fullscreen] → Use user gestures, existing shims, explicit error handling, and iPhone validation.
- [A self-contained HTML file may grow too large] → Measure release artifact size and extract resources only when tests confirm the contract remains intact.
- [Specifications may become stale] → Review them in every behavior-changing proposal and link them to tests or acceptance criteria.

## Migration Plan

1. Review and accept these two capabilities as the project baseline.
2. For every future extraction, create an OpenSpec proposal stating which requirement is preserved or changed.
3. Add tests and adapters before moving data, translations, SVG, audio, or logic out of the legacy runtime.
4. Run `npm run check` and E2E before every release; test real iOS Safari when storage, audio, fullscreen, or layout changes.
5. If a migration fails, retain the adapter and roll back only the new module while preserving existing keys and data.

## Open Questions

- Which backup format will become stable after the current restore flows are covered?
- Which minimum iOS version will be adopted when a formal compatibility matrix is published?
