# E2E Tests

No E2E test suite is configured yet.

Critical browser flows:

- Open the focused command center and enter `/noesis`.
- Confirm the initial Noesis decision is held for verification.
- Mark independent evidence verified and lower uncertainty below the policy
  threshold.
- Confirm the live warrant changes to allowed.
- Record a dry-run receipt and confirm the lease automatically revokes.
- Reload and confirm the workspace and receipt persist locally.
- Exercise the two-step reset and confirm the default held state returns.
- Verify desktop and 390px mobile layouts have no horizontal overflow.
- Verify import, export, reset, form controls, and receipt actions are keyboard
  reachable with visible focus.
- Confirm browser console logs contain no application warnings or errors.
