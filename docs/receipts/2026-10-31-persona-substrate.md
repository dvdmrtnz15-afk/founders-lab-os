# Receipt: Persona Substrate

- Date: 2026-10-31
- Branch: `feat/persona-substrate` (local; not pushed)
- Base: `4c72846`
- Risk tier: 3 (authorization kernel change, opt-in)

## Request

Survey the portfolio repositories for persona and agent innovations, adapt the
strongest to this architecture, and implement them.

## Survey

All 25 local repositories were searched. Material persona and agent code
lives in LYZT-AI (about 2,150 matching files), with supporting ideas in
free-agents (capsule format), founderlab-cogmesh (conflict and clone
handling), and FounderLab-Agent-Hub (cognition-cycle validation). SpellShimmer
exists in this session only as the LYZT-AI Oracle policy and brand voice and a
SkillAx skill; no standalone SpellShimmer repository was reachable.

## Changes

- `src/lib/persona/`: schema, attenuation, fingerprint, council, stylometric,
  claim guard, and reference registry (constitution, 12 roles, SpellShimmer
  Oracle).
- `src/lib/noesis.ts`, `src/lib/noesis-schema.ts`: optional `persona` and
  `council`; seven blocker codes; persona and council join the authority
  fingerprint only when present; receipts record the acting persona;
  `requiresHumanApproval` combines tier policy and persona escalation.
- `src/lib/hash.ts`, `src/lib/warrant-level.ts`: shared helpers extracted to
  avoid an import cycle. Behavior unchanged.
- `src/app/noesis/components/persona-panel.tsx`: persona picker and identity
  card, review council, and voice lint. Warrant rail now lists hard blockers
  first so the four-item cap never hides one.

## Verification

- `pnpm test`: 11 files, 115 tests passed (67 pre-existing, 48 new).
- `pnpm lint`: 0 problems. `pnpm format:check`: clean. `pnpm build`: passed.
- `tsc --noEmit`: clean.
- Fingerprint compatibility: `authorityFingerprint(initialNoesisWorkspace)`
  is `fnv1a64:1aa796c40d42b698` on both `4c72846` and this branch, pinned in a
  test.
- Browser check (Playwright, production build): persona selection, ceiling,
  tool, and escalation blockers, a council hard veto, and Oracle voice lint all
  behaved as specified; no console errors; no horizontal overflow at 390 px.

## Residual risk

- The fingerprint uses FNV-1a, which detects edits but is not a signature.
  Persona specs are not cryptographically signed yet (LYZT signs contracts
  with Ed25519).
- Lease tools are free text; persona tool matching normalizes case and spacing
  only.
- The claim guard also flags negated phrases ("not guaranteed").
- Persona selection is limited to the reference registry; custom personas are
  not yet editable in the UI.

## Rollback

Revert the branch commit. Workspaces saved with a persona or council would then
fail strict import; remove those two fields to load them.
