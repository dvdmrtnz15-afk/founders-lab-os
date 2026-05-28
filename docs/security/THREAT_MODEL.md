# Threat Model

## Current Assets

- Source code and governance docs.
- Local development workflows.
- GitHub repository.
- Preview and release workflow.

## Current Risks

- Accidental secret exposure.
- Agent edits that bypass planning and review.
- Hidden backend features without UI or RBAC surfacing.
- Production deploy without preview evidence.

## Controls

- `AGENTS.md` workflow gates.
- Security docs and elevated-review triggers.
- PR template requiring security and rollback notes.
- `.env*` ignored and `.env.example` committed without secrets.
