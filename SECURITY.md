# Security Policy

FounderLab OS treats auth, secrets, user data, payments, production deploys, and
tenant boundaries as elevated-risk areas.

## Rules

- Do not read or print `.env` files without explicit approval.
- Do not commit secrets, tokens, private keys, cookies, or production data.
- Do not weaken auth, validation, RBAC, logging, or rate limits to make a build
  pass.
- Escalate auth, payments, production deploy, compliance, and data-retention
  changes for explicit review.

## Reporting

Security concerns should be documented in `docs/security/THREAT_MODEL.md` and
tracked with an implementation receipt under `docs/receipts/`.

## Baselines

Use these documents as the local security baseline:

- `docs/security/RBAC_POLICY.md`
- `docs/security/THREAT_MODEL.md`
- `docs/security/ASVS_CHECKLIST.md`
- `docs/security/SECRETS_POLICY.md`
