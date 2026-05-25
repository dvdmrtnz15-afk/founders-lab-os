# Feature Build Skill

Use this skill when adding or improving product functionality.

## Process

1. Restate the feature and define acceptance criteria.
2. Inspect relevant files and components.
3. Identify the smallest safe implementation that delivers value.
4. List files likely to change.
5. Identify the risk tier and potential impact.
6. Request approval before editing when required.
7. Implement in small, reviewable patches.
8. Run the project formatter.
9. Run lint/check and apply fixes if available.
10. Run the build and perform a quick smoke test.
11. Summarize changed files, risks, and next actions.

## Product rules

- Do not hide core value behind login unless required.
- Show core value within seconds.
- Prioritize mobile-first UX.
- Do not add dependencies without approval.
- Avoid modifying auth, billing, database, deployment, or env files unless required.
