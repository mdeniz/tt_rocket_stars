# Proposal

## Why

Support needs operational account and synchronization health information, but the current product is a static browser app with no trusted server boundary. Defining the boundary first prevents an admin view from becoming a client-side privilege escalation or a source of child activity data.

## What Changes

- Define a server-side admin diagnostics capability for a future Edge Function or trusted backend.
- Restrict responses to minimal account and sync health categories.
- Define authorization, audit, retention, deletion, rate-limit, and secret-handling requirements.
- Document why no browser UI, privileged API, migration, or credential is added yet.

## Capabilities

### New Capabilities

- `admin-diagnostics`: trusted, minimal, audited operational diagnostics for authorized administrators.

### Modified Capabilities

None.

## Impact

Adds a technical contract and operational documentation only. The current Vite/GitHub Pages app, Supabase browser client, local gameplay, telemetry queue, and cloud progress data remain unchanged. Backend implementation and provider configuration are a subsequent change.
