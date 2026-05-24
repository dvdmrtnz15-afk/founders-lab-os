# Feature Build Skill

Use this skill when adding or improving product functionality.

## Process

1. Restate the feature.
2. Inspect relevant files.
3. Identify the smallest safe implementation.
4. List files likely to change.
5. Identify risk tier.
6. Ask before editing.
7. Implement in small patches.
8. Run formatter.
9. Run lint/check if available.
10. Run build.
11. Summarize changed files, risks, and next action.

## Product rules

- Do not hide value behind login unless required.
- Show what the app does within seconds.
- Prioritize mobile UX.
- Do not add dependencies without approval.
- Do not touch auth, billing, database, deployment, or env files unless required.
