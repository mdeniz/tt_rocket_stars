# Design

The readiness document is the provider-neutral contract for the transition. A small checker asserts the required identity, fallback, staged-gate, recovery, and approval language and rejects privileged credential or password-hash copying. Unit tests exercise both the valid contract and unsafe omissions.

Hosted staging, canary, and production cutover are separate approval gates. The local implementation ends after documenting their required evidence.
