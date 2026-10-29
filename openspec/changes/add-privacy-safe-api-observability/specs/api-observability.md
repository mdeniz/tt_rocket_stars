# API observability

## Requirements

### Requirement: Correlate without exposing private data
The API MUST return a bounded request ID and emit structured error events containing no credentials, email bodies, child/pilot identifiers, payloads, or gameplay answers.

#### Scenario: An API error is correlated safely
- **WHEN** a request fails locally
- **THEN** the response and `api.error` event share the request ID and the event contains only bounded status/code metadata.

### Requirement: Keep monitoring provider-neutral
Local tests MUST run without hosted monitoring credentials and the incident response contract MUST define approval-gated hosted ingestion.

#### Scenario: Local development remains credential-free
- **WHEN** the API is tested without provider credentials
- **THEN** structured events are available locally and hosted ingestion remains unconfigured.
