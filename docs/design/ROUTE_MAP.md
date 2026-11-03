# Route Map

| Route     | Purpose                               | Owner          | Notes                                                                         |
| --------- | ------------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| `/`       | Focused governance command center     | Frontend Agent | Product entry, policy posture, and harness launch                             |
| `/noesis` | TET Noesis + probability-flow harness | Frontend Agent | Browser-local forecast, boundary gate, and dry-run receipt; no external tools |

| `/exchange` | TrueNorth asset decision workspace | Frontend Agent | Investors: local dossiers, comparison, scoped packets, encrypted vault |
| `/experts` | Expert Desk: route a task to the right Claude expert | Frontend Agent | Public routing preview; allowlisted signed-in users get a live, reviewed answer |
| `/sign-in` | GitHub sign-in and sign-out | Frontend Agent | Shows an honest "not configured" state without credentials |
| `POST /api/experts/consult` | Live expert answer | Backend Agent | Same-origin, signed in, allowlisted, spend-limited; see `docs/architecture/AUTH.md` |

## Rule

Every new user-facing capability must update this file with its route, owner,
and intended user.
