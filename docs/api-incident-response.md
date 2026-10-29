# API incident response and privacy-safe monitoring

The Hono API emits structured `request.completed` and bounded `api.error` events with a correlation request ID. Error events contain only the event name, request ID, HTTP status, bounded error code, and timestamp. They never contain passwords, tokens, cookies, email bodies, child or pilot identifiers, pilot payloads, or gameplay answers.

## Local operation

Local development writes structured events to the console after redaction. Tests inspect event shape without credentials or production records. No hosted monitoring provider or ingestion credential is required.

## Response procedure

1. Capture the request ID, timestamp, deployment version, and bounded status/code from the event.
2. Search server-side logs by request ID only; do not request or copy user payloads, credentials, cookies, or answer content into an incident ticket.
3. Classify authentication, authorization, availability, data-integrity, or privacy impact and assign an owner.
4. Preserve the smallest relevant redacted evidence bundle, record containment and recovery actions, and rotate credentials only through the approved secret-management process.
5. Hosted ingestion, retention, alert thresholds, and on-call routing require an explicit provider and operations approval; they are not configured locally.
