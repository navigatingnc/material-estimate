# Collaboration and Integration Architecture

## Current delivery

The application is deliberately **local-first**. A versioned workspace is stored in the browser, and users can export JSON backups or CSV records. No project record, token, pricing credential, or customer information is sent to an application service.

## Versioned contract

The portable JSON document contains a top-level `version`, `updatedAt`, and a `project` with project metadata and line items. Import validates data at the boundary and skips malformed items. Future migrations must be explicit functions such as `v1 → v2`; never silently reinterpret historical quantities, pricing, or markup.

## Future collaboration boundary

Shared estimates require a server-side implementation. The browser should authenticate with short-lived sessions and call an API such as:

| Capability | Server responsibility |
| --- | --- |
| Accounts and teams | Identity, invitations, roles, and audit logs |
| Projects | Tenant isolation and role-based authorization on every read and write |
| Revisions | Immutable snapshots, author identity, timestamps, and compare/restore operations |
| Attachments | Virus-scanned object storage using time-limited upload/download URLs |
| Imports and exports | Size limits, schema validation, rate limiting, and activity records |

> Never place an API key, manufacturer pricing credential, or provider secret in the browser bundle, local storage, repository, or CI workflow.

## Provider integrations

Supplier catalog lookup, price synchronization, accounting export, and CRM integration must be adapter services running on the server. Store encrypted provider credentials in a managed secret service; use least-privilege scopes, a rotation policy, request timeouts, retry budgets, and structured audit events. The browser receives only the data required to render an estimate.

## Recommended implementation sequence

1. Add authenticated API endpoints and tenant-scoped persistence.
2. Add revisions and audit events before collaborative editing.
3. Introduce role-based project sharing and read-only estimate links.
4. Add one provider adapter behind a feature flag, monitored for failures and rate limits.
