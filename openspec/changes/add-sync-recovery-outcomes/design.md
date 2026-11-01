# Design

`createCloudSync` classifies normalized provider errors into `conflict`, `retryable`, or `permanent` outcomes. The result remains `status: failed` for compatibility, while the optional `outcome` field gives the client a typed recovery decision. Conflict handling remains separate and continues to fetch the remote snapshot.

The legacy settings adapter maps retryable failures to localized recovery messaging. Local data and sync metadata are only written after a successful provider write. Existing feature flags and direct-provider behavior are unchanged.
