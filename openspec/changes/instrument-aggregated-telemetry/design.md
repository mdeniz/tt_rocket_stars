# Design

## Context

The existing telemetry service is provider-independent and in-memory. The Vite build already inlines the cloud adapter and legacy scripts into the self-contained release, while the gameplay runtime remains classic-script based.

## Goals / Non-Goals

**Goals:**

- Add aggregate event vocabulary and bounded sampling/retention without a second collector.
- Make runtime hooks safe when the module is unavailable or consent is absent.
- Preserve the self-contained build and legacy script order.

**Non-Goals:**

- Adding a consent UI, provider, account linkage, persistent telemetry, or dashboards.
- Capturing raw errors, stacks, URLs, question answers, pilot identity, or per-learner history.

## Decisions

- Extend `EVENT_DEFINITIONS` with mission mode/operation, bounded performance buckets, and enum-only runtime errors. Error hooks submit codes and sources, never exception objects.
- Apply sampling before queue insertion and retention pruning before reads, writes, and flushes. The queue remains bounded and in memory.
- Inline one consent-disabled service instance through the existing Vite transform. Legacy scripts call it through optional chaining, so missing configuration or old builds remain playable.
- Keep provider quota, EU region, retention, and lawful-basis choices outside the browser module and document them as deployment gates.

## Risks / Trade-offs

- [Hooks are dormant until consent exists] → This is intentional; consent UI is a separate privacy/product change.
- [Aggregate buckets lose detail] → Prefer minimization and expand only through reviewed specification changes.
- [Inline runtime increases release HTML] → Reuse the existing self-contained inline architecture and verify the build.

## Migration Plan

No migration is required. Removing the hooks or runtime placeholder restores the previous behavior without changing game data. Provider integration requires a separate review.
