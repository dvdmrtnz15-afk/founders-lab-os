# Invariant Probability Flow — Lyzt interoperability contract

Status: local contract implemented; Lyzt adoption pending an exclusive editor
lease and independent review.

## Ownership boundary

TET Noesis owns the probability-flow protocol, deterministic resolution, and
human-visible proof. Lyzt owns live effect authority, capability leases,
commit-time checks, and signed/chained receipts.

Lyzt already uses `tet.ts` for Territory and Epoch Tracking. That module and
the frozen `tet-bridge.ts` are unrelated to this protocol and must not be
extended or renamed for probability flow. The additive wire owner is the
allow-listed `ip/governance-microkernel/transition-payload.ts`. The verifier is
a pure module under `server/governance/probability-flow`, exported to production
callers only by `server/governance/kernel-api`.

## Canonical proof bundle

`createProbabilityFlowProofBundle()` emits:

```ts
type ProbabilityFlowProofBundle = {
  bundleVersion: "0.1.0";
  canonicalization: "ipf-json-sorted-v1";
  protocolInput: Omit<ProbabilityFlowProtocol, "receipts">;
  receipt: ProbabilityFlowReceipt;
};
```

`ipf-json-sorted-v1` recursively sorts object keys by Unicode code-unit order,
preserves array order, uses JSON number/string encoding, and removes only the
top-level `receipts` history. All protocol values have already passed the strict
schema. The FNV-1a value in `receipt.inputDigest` is a local replay/drift marker,
not cryptographic proof.

The checked demo vector at `2026-07-13T12:00:00.000Z` has local marker
`ipf-fnv1a64-72062089339a8d0d`. This value locks canonicalization behavior for
the fixture. Its SHA-256 canonical-input commitment is
`sha256:ec3eba97e086e86291c9e98a8bad71834d04379fb9447196d44de770be6bb29b`;
Lyzt must independently reproduce it from the canonical input bytes.

The Lyzt transition readout should be additive and absent for legacy calls:

```ts
type ProbabilityFlowTransitionReadout = {
  protocolVersion: "0.1.0";
  canonicalization: "ipf-json-sorted-v1";
  canonicalInputHash: `sha256:${string}`;
  replayVerified: true;
  selectedEffectIds: readonly string[];
  gatePass: boolean;
  bundle: ProbabilityFlowProofBundle;
};
```

Before constructing the v2 payload, Lyzt must recanonicalize `protocolInput`,
recompute `canonicalInputHash`, replay the receipt, and reject non-canonical or
unknown versions. `selectedEffectIds` must be dependency-closed and a subset of
`receipt.authorizedEffectIds`. Empty selection or `hold` means `gatePass=false`.
Every selected effect must match the live lease scope; observer expiry or any
invalidated transitive dependency revokes that authority before commit.

## Receipt and byte-stability rules

1. Add optional `probabilityFlow` to v2 `GovernanceTransitionPayload` and
   `buildV2Payload` with the existing conditional-spread pattern.
2. With the field absent, `JSON.stringify(buildV2Payload(args))` must remain
   byte-identical to the pre-adoption result.
3. With the field present, receipt v3 includes it inside `base`; the existing v3
   SHA-256 hash therefore commits to the complete proof bundle. Receipt v3 is a
   hash envelope, not an Ed25519 signature. Its optional Merkle anchor signs the
   batch root and remains metadata that cannot change the leaf hash.
4. A local FNV match alone never sets `replayVerified` or `gatePass`.
5. A probability-flow ALLOW never bypasses Lyzt's other gates. Final effect
   authority is the conjunction of replay, subset, lease, rights, safety,
   freshness, and commit-time checks.

For an Ed25519 claim, `canonicalInputHash` and a hash of the canonical complete
bundle must be explicitly projected into the existing receipt-v2 signed-field
manifest. Attaching the bundle as an ordinary extension is insufficient:
ordinary extensions are leaf-bound, and only named projected extension fields
are covered by the Ed25519 envelope. The writer must derive the signed-fields
hash after the probability-flow commitment is attached, sign that derived
hash with the existing governance key, and the verifier must independently
recompute the projection and verify the signature. No new signer or parallel
receipt ledger is allowed.

## Required conformance tests

- identical inputs with different object insertion order canonicalize equally;
- changing any risk, boundary, observer, principal, witness, memory-fact, or
  action value changes the SHA-256 input commitment;
- receipt history does not change the canonical protocol input;
- receipt tampering or replay mismatch fails closed;
- partial authorization cannot execute a blocked sibling effect;
- observer expiry invalidates evidence, plan, certificate, lease, and effect;
- changing a historical fact digest invalidates replay while a new
  interpretation revision preserves that fact digest;
- omitting `probabilityFlow` preserves legacy v2 bytes;
- changing any included proof-bundle value changes the v3 receipt hash;
- changing the proof-bundle commitment changes the receipt-v2 signed-fields
  hash and makes the prior Ed25519 signature fail verification;
- a leaf-only extension without the signed-field projection cannot satisfy the
  signed-proof acceptance criterion;
- selected effects outside lease scope or the authorized dependency closure are
  denied at commit.

## Adoption sequence

1. Land the additive v2 type/builder slot and byte-stability tests.
2. Land the pure verifier and export it through the canonical kernel API.
3. Add the two probability-flow commitments to the existing receipt-v2 signed
   projection, then prove hash derivation and Ed25519 verification end to end.
4. Wire the verified readout into the active prepare/commit chokepoint behind a
   default-off flag; do not create a parallel authority plane. Each transition
   packet action must be one of the selected authorized effects; its packet
   input hash and judgment-bound lease then bind the flow proof to commit.
5. Shadow-replay local proof bundles and compare deterministic receipts.
6. Add separate personality-interaction-144 and Identity-Bloom-12x12 adapters.
   Neither adapter may reinterpret the other's 144 dimensions.
7. Require independent safety, rights, and scientific review before any live
   effect or production rollout.
