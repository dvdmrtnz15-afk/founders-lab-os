# Data Model

No application database is currently implemented.

## Browser-local Noesis Workspace

The Noesis harness stores one strict, versioned JSON workspace under
`founderlab.noesis.workspace.v1`. The contract includes:

- objective, canonical state, uncertainty, warrant level, and blocker;
- evidence items with claim, source, status, weight, independence, and timestamp;
- capability lease scope, tools, budget, expiry, approval, and active state;
- bounded local audit events and historical dry-run receipts.

Storage is local to the browser origin. Import is rejected unless the complete
object passes `noesisWorkspaceSchema`. Reset deletes the local key. No background
sync, analytics, backup, or remote retention exists.

## Future Data Rules

- Document entities, ownership, PII fields, tenant boundaries, indexes, and
  retention rules before adding migrations.
- Include rollback notes and data-impact analysis with every migration.
- Keep generated analytics and receipts separate from user-sensitive data.
