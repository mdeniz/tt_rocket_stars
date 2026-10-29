# Design

The application role is checked against an allowlist of application tables and DML privileges. API requests use a bounded in-memory limiter with injectable time for local reproducibility; hosted shared-store enforcement remains a deployment contract. Resource repositories receive authenticated identity and perform ownership checks at the boundary.
