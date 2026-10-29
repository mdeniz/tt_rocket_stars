# Design

The bootstrap command delegates to the existing local Docker/migration/integration harness. Environment validation remains fail-closed for staging and production while preserving development defaults. Load evidence uses a deterministic in-memory quota contract rather than an unbounded network benchmark.
