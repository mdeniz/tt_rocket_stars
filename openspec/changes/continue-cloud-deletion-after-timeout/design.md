# Design

## Context

The provider-neutral cloud boundary serializes uploads, reads, restores, and deletion through one promise tail. Automatic synchronization can already be active when a user confirms deletion. The queue must preserve ordering without allowing a rejected operation to prevent the next operation from being scheduled. See `proposal.md` for the observed failure and motivation.

## Goals / Non-Goals

**Goals:**

- Make queue settlement explicit for rejected, aborted, and timed-out operations.
- Preserve the authenticated ordering guarantee and local-first data safety.
- Keep deletion status distinguishable from upload or synchronization status.
- Add deterministic unit coverage and connected browser evidence.

**Non-Goals:**

- Changing Supabase schema, RLS, Edge Function contracts, or timeout values.
- Retrying deletion through an unrelated upload retry loop.
- Promoting `index_next.html` to the stable release.

## Decisions

- Keep one provider-operation queue, but ensure its tail always resolves after each operation settles so the next queued task can run.
- Return operation-specific status values from the cloud-sync boundary; the legacy UI maps deletion failures to deletion-specific translated text.
- Test the queue with a rejected upload followed by a deletion spy, and retain existing cancellation/coalescing tests.
- Prefer a queue-level fix over bypassing serialization because concurrent deletion and upload could otherwise race against the same account data.

## Risks / Trade-offs

- [Risk] A provider request may remain open until its configured timeout. → Mitigation: retain the existing trusted-transport bound and make queue continuation deterministic after settlement.
- [Risk] A deletion can succeed after a preceding upload failure, surprising users who saw the earlier failure. → Mitigation: expose the final deletion result independently and preserve a local recovery path.

## Migration Plan

No schema or data migration is required. Deploy the code through the development artifact, verify the authenticated failure and success paths, and retain the stable artifact unchanged. Roll back by reverting the provider-neutral queue/UI change.
