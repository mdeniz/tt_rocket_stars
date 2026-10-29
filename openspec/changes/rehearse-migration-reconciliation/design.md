# Design

`reconcileMigrationPackage` validates the package checksum, reads only the deterministic IDs from local PostgreSQL, maps database columns back to the package contract, and compares stable per-table checksums and counts. It reports table names, counts, checksum status, and an ownership result without returning row payloads.

The integration rehearsal uses two synthetic accounts, a pilot, a versioned progress snapshot, a crew, membership, and pilot access. It proves cross-owner references are rejected before import, verifies a successful reconciliation, rejects a tampered package checksum, forces a failure after the first table and verifies that both rows and the replay ledger are absent, then imports and replays the package successfully.
