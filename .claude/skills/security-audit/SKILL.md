# Security Audit Skill

Use this before auth, billing, APIs, uploads, data handling, or production.

Inspect:

- Environment file access
- Secrets leakage
- Client/server data boundaries
- Input validation
- API routes
- Server actions
- Logging risk
- Dependency risk
- Auth/session assumptions
- Payment or customer-data exposure

Rules:

- Never read .env unless explicitly authorized.
- Never print secrets.
- Never weaken security for convenience.
- Flag uncertainty clearly.
