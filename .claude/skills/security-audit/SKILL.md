# Security Audit Skill

Use this before working on auth, billing, APIs, uploads, data handling, or production systems.

Process:

- Check environment file access.
- Look for secrets leakage.
- Verify client/server data boundaries.
- Validate input handling and sanitization.
- Review API routes and server actions.
- Assess logging for sensitive data exposure.
- Evaluate dependency security risk.
- Confirm auth/session assumptions.
- Check for payment or customer-data exposure.

Rules:

- Do not read `.env` files unless explicitly authorized.
- Do not print secrets.
- Do not weaken security for convenience.
- Flag uncertainty or unknowns clearly.
