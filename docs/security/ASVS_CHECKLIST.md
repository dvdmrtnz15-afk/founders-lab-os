# ASVS Checklist

Use OWASP ASVS as the security verification baseline when auth, API, user data,
or privileged actions are added.

## Current Baseline

- [ ] Authentication model documented before implementation.
- [ ] Authorization policy documented before protected resources.
- [ ] Input validation documented for APIs and forms.
- [ ] Secrets are never committed.
- [ ] Error messages avoid secrets and internal details.
- [ ] Security-sensitive changes receive elevated review.
