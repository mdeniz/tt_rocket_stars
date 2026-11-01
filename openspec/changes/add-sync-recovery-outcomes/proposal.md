# Proposal: Expose typed sync recovery outcomes

Map provider-neutral cloud failures to stable client outcomes so the offline-first client can distinguish conflicts, retryable transport/provider failures, and permanent failures without exposing provider details.

This change keeps automatic retries bounded, preserves local progress, and uses the existing manual sync control for recovery. Hosted provider and production validation remain outside the local-only scope.
