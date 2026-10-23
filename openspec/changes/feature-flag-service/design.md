# Design

## Context

The repository is an offline-first Vite application whose current runtime is
mostly ordered legacy JavaScript. The feature-flag capability is a foundation
for later rollout work, so it must not add a provider, network request, or
React dependency at this stage.

## Goals / Non-Goals

**Goals:**

- Define a small, typed-by-contract service that can be used from legacy code.
- Keep defaults deterministic and safe when every external input is absent.
- Validate payloads and cache metadata at the service boundary.
- Make cache storage injectable so restricted-storage environments are harmless.

**Non-Goals:**

- Connecting PostHog, Supabase, or another provider.
- Targeting authenticated accounts or percentage rollouts.
- Adding feature-flag UI or changing existing gameplay behavior.

## Decisions

- Use a plain JavaScript module with JSDoc typedefs rather than introducing a
  TypeScript toolchain for one isolated service. This preserves the current
  Vite/legacy architecture while exposing a typed contract to editors and tests.
- Store definitions as immutable caller-owned data copied into the service. This
  prevents later mutation from changing safety guarantees after construction.
- Represent payloads as `{ values, fetchedAt }` and normalize only known boolean
  values. Invalid entries are discarded individually instead of invalidating all
  safe defaults.
- Inject cache read/write functions instead of accessing `localStorage` directly.
  The default adapter is a no-op, so storage restrictions cannot block startup.
- Use an absolute TTL comparison against an injected clock. This makes expiry
  deterministic in unit tests and avoids stale experimental enablement.

## Risks / Trade-offs

- [Risk] A provider integration may need richer targeting or metadata later →
  keep this service provider-independent and add those concerns in a separate
  capability with explicit requirements.
- [Risk] A stale non-experimental value may remain active after expiry →
  expired payloads are discarded for all flags; only safe defaults remain.
- [Risk] Legacy callers may pass malformed definitions →
  constructor validation rejects invalid definitions without touching gameplay.

## Migration Plan

1. Add the isolated service and unit tests.
2. Keep all existing feature paths unchanged until a provider and rollout policy
   are specified in later issues.
3. If the service is rejected, remove the isolated module and tests without a
   data migration or runtime compatibility change.
