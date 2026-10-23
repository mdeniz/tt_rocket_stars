# Design

Targeting is evaluated locally from a validated account UUID supplied by the caller. An allowlist grants access first; otherwise a stable FNV-1a-derived bucket over `flagName:accountUuid` is compared with the configured percentage. Invalid or missing identity returns the flag's declared safe default. Authentication and backend authorization remain outside this module.
