# admin-diagnostics Specification

## Purpose
Defines a trusted operational diagnostics boundary for authorized administrators without exposing child activity, gameplay data, credentials, or privileged provider capabilities to the static browser client.

## Requirements

### Requirement: Authorization is server-side and fail-closed
The diagnostics service SHALL validate an authenticated administrator role on the server for every request and SHALL deny unauthenticated, unauthorized, malformed, and client-forged target requests without revealing account existence or operational data.

#### Scenario: Unauthenticated request
- **WHEN** a request has no valid administrator session
- **THEN** the service denies it without returning account or synchronization details

#### Scenario: Forged client role
- **WHEN** a browser supplies an admin-looking claim or target account identifier without server-authorized membership
- **THEN** the service denies it and does not trust the supplied claim or identifier

### Requirement: Diagnostics are minimal and exclude child activity
The service SHALL return only operational account and synchronization health categories, and SHALL exclude pilot identity, question answers, mission history, child activity, raw telemetry, tokens, email content, and exception messages.

#### Scenario: Authorized health lookup
- **WHEN** an authorized administrator requests an account health summary
- **THEN** the response contains only approved status, timestamp, outcome, retry bucket, and provider availability fields

#### Scenario: Child activity is requested
- **WHEN** a request attempts to select pilot, mission, answer, or raw telemetry fields
- **THEN** the service rejects the selection and returns no child activity data

### Requirement: Administrative operations are audited and bounded
The service SHALL audit diagnostics reads, retention changes, and cloud-deletion requests, and SHALL enforce rate limits, retention controls, and recoverable deletion behavior without copying gameplay data into the audit record.

#### Scenario: Audited diagnostic read
- **WHEN** an authorized administrator reads a health summary
- **THEN** the service records administrator identity, action category, pseudonymous target, outcome, and timestamp under the audit retention policy

#### Scenario: Deletion operation
- **WHEN** an authorized administrator requests cloud deletion
- **THEN** the service records the action and outcome, applies the documented deletion policy, and preserves local browser progress

### Requirement: Privileged credentials stay outside the browser
The service SHALL keep service-role keys and administrative credentials in the trusted backend environment and SHALL never include them in browser responses, static assets, or client configuration.

#### Scenario: Static release inspection
- **WHEN** the production static bundle is inspected
- **THEN** it contains no service-role key, administrative credential, access token, or refresh token
