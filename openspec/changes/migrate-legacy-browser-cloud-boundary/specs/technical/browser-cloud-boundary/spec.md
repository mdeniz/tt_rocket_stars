# Spec Delta

## Purpose

Provide a provider-neutral browser boundary for optional authenticated cloud
operations while keeping local gameplay independent from network availability and
administrative credentials.

## ADDED Requirements

### Requirement: Browser cloud operations use domain contracts

The browser MUST invoke cloud synchronization, pilot discovery, conflict handling,
and deletion through a domain-level contract rather than constructing provider-
specific table or RPC queries.

#### Scenario: Authenticated synchronization

- **WHEN** an authenticated user requests a cloud upload or download
- **THEN** the browser invokes the domain cloud contract
- **AND** the operation preserves ownership, version, retry, and conflict semantics
- **AND** the browser does not construct a provider-specific query

#### Scenario: Provider failure

- **WHEN** the domain cloud operation is unavailable or fails
- **THEN** the browser reports a safe failure state
- **AND** local gameplay and local progress remain available
- **AND** local progress is not deleted or replaced implicitly

### Requirement: Browser cloud access remains least-privilege

The browser MUST use only publishable configuration and user-authenticated context;
administrative credentials and provider-management operations MUST remain outside the
browser boundary.

#### Scenario: Bundle inspection

- **WHEN** a production bundle is inspected
- **THEN** it contains no service-role or administrative credential
- **AND** it contains no provider-management operation

#### Scenario: Signed-out access

- **WHEN** a signed-out user plays or opens cloud settings
- **THEN** no authenticated cloud data operation is attempted
- **AND** local gameplay remains usable
