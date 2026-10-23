# Account-targeted feature flags

Add provider-independent account UUID targeting and deterministic percentage rollout to the offline feature-flag evaluator.

This change enables future authenticated rollout adapters without adding network requests, secrets, authentication dependencies, or gameplay coupling to the evaluator.
