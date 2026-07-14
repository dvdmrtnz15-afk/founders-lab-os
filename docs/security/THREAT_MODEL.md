# Threat Model

## Current Assets

- Source code and governance docs.
- Local development workflows.
- GitHub repository.
- Preview and release workflow.
- Browser-local Noesis workspace and imported JSON files.

## Current Risks

- Accidental secret exposure.
- Agent edits that bypass planning and review.
- Hidden backend features without UI or RBAC surfacing.
- Production deploy without preview evidence.
- Malformed or oversized workspace imports.
- Sensitive text entered into a browser-local workspace on a shared device.
- A dry-run receipt being mistaken for proof of external execution.

## Controls

- `AGENTS.md` workflow gates.
- Security docs and elevated-review triggers.
- PR template requiring security and rollback notes.
- `.env*` ignored and `.env.example` committed without secrets.
- Strict Zod validation, a 1 MB import limit, and rejection of unknown fields.
- No Noesis network adapter, telemetry, cookie, server write, or production tool.
- Explicit local-only and dry-run labels, bounded history, and two-step reset.
