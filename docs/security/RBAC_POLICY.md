# RBAC Policy

No authentication or RBAC implementation exists yet.

## Default Policy

- Public unauthenticated access is allowed only for intentionally public pages.
- Admin, billing, production, secrets, and user-data actions require explicit
  role definitions before implementation.
- Every protected action must define resource, action, role, ownership rule, and
  audit requirement.
