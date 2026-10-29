# Design

Request IDs remain validated or generated at the Hono boundary and are returned in responses. Error events use an allowlist and never include exception messages or request payloads. Existing field redaction remains in place for completion logs, while route paths are omitted to avoid leaking resource identifiers.
