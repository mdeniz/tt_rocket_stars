# Design

## Context

The application is deployed as a self-contained static Vite release. Browser Supabase access uses only a public anonymous key and Row Level Security; there is no trusted application server or Edge Function in this repository.

## Goals / Non-Goals

**Goals:**

- Establish a server-side authorization and data-minimization contract before implementation.
- Keep support diagnostics separate from child analytics and gameplay telemetry.
- Make audit, retention, deletion, secret handling, and rate limiting explicit deployment gates.

**Non-Goals:**

- Adding a static admin page or browser authorization check.
- Adding service-role credentials, admin migrations, an Edge Function, or a new provider in this change.
- Exposing pilot, mission, question, answer, or raw telemetry data.

## Decisions

- Use a trusted Supabase Edge Function or equivalent backend as the only diagnostics boundary. A static client cannot safely hold or enforce administrative authority.
- Authorize using server-validated administrator membership, not an email string, UI flag, account identifier, or client claim.
- Return coarse operational categories and pseudonymous targets. Keep audit records separate from product data and exclude child activity.
- Treat retention period, deletion semantics, EU processing location, quotas, rate limits, and admin identity provider as deployment configuration requiring review.

## Risks / Trade-offs

- [Support cannot inspect diagnostics until a trusted backend exists] → Keep the Supabase Dashboard as the interim operational surface.
- [Coarse fields reduce debugging detail] → Add fields only through a reviewed spec change and never copy raw activity.
- [Audit records can become sensitive] → Minimize targets, apply a separate retention policy, and test deletion and access boundaries.

## Migration Plan

No migration or runtime change is made. A future implementation must add the backend, admin provisioning, audit store, RLS/service-role boundary, and tests before enabling any client entry point. Rollback disables the backend endpoint and leaves local and cloud gameplay data unchanged.
