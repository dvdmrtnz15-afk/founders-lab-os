import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  applyProbabilityFlowResolution,
  canonicalizeProbabilityFlowInput,
  createProbabilityFlowProofBundle,
  createInitialProbabilityFlowProtocol,
  reinterpretMemoryEvent,
  resolveProbabilityFlow,
  verifyProbabilityFlowProofBundle,
  verifyProbabilityFlowReplay,
} from "./probability-flow";
import { probabilityFlowProtocolSchema } from "./probability-flow-schema";

const now = "2026-07-13T12:00:00.000Z";

describe("proof-carrying probability flow", () => {
  it("authorizes only the bounded, dependency-closed subset", () => {
    const receipt = resolveProbabilityFlow(
      createInitialProbabilityFlowProtocol(now),
      now,
    );

    expect(receipt.decision).toBe("allow_partial");
    expect(receipt.authorizedEffectIds).toEqual([
      "effect-draft-repair-message",
    ]);
    expect(receipt.blockedEffects[0]).toMatchObject({
      effectId: "effect-rewrite-canonical-identity",
      blockerCodes: expect.arrayContaining([
        "action_not_authorized",
        "identity_promotion_blocked",
        "protected_boundary_crossed",
        "risk_limit_exceeded",
      ]),
    });
    expect(receipt.completeLineage).toBe(true);
  });

  it("does not let transient affect promote canonical identity", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.identityPromotion.explicitAuthority = true;
    protocol.identityPromotion.unresolvedContradictions = 0;
    protocol.identityPromotion.unresolvedTrustLiabilities = 0;

    const receipt = resolveProbabilityFlow(protocol, now);

    expect(receipt.identityPromotion.allowed).toBe(false);
    expect(receipt.identityPromotion.blockers).toContain(
      "Transient affect cannot directly promote canonical identity.",
    );
  });

  it("uses tail and first-passage risk instead of high point utility", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    const identityBoundary = protocol.boundaries.find(
      (boundary) => boundary.id === "boundary-canonical-identity",
    );
    const identityAction = protocol.actions.find(
      (action) => action.id === "effect-rewrite-canonical-identity",
    );

    protocol.identityPromotion = {
      requested: true,
      source: "deliberative_evidence",
      explicitAuthority: true,
      unresolvedContradictions: 0,
      unresolvedTrustLiabilities: 0,
    };
    if (identityBoundary) {
      identityBoundary.authoritySatisfied = true;
      identityBoundary.outwardFlux = 0.01;
      identityBoundary.crossingProbability = 0.01;
    }
    if (identityAction) identityAction.authorized = true;

    const receipt = resolveProbabilityFlow(protocol, now);
    const blockedIdentity = receipt.blockedEffects.find(
      (effect) => effect.effectId === "effect-rewrite-canonical-identity",
    );

    expect(identityAction?.utility).toBe(0.96);
    expect(blockedIdentity?.blockerCodes).toEqual(["risk_limit_exceeded"]);
  });

  it("keeps the two 144 systems semantically separate and certifies witnesses", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    const sources = protocol.reductions.map(
      (reduction) => reduction.sourceSystem,
    );

    expect(sources).toEqual([
      "personality_interaction_144",
      "identity_bloom_12x12",
    ]);

    protocol.reductions[0].retainedWitnessKinds = [
      "negative_evidence",
      "rights_coordinate",
    ];
    const receipt = resolveProbabilityFlow(protocol, now);

    expect(receipt.reductionResults[0]).toMatchObject({
      sourceSystem: "personality_interaction_144",
      certified: false,
    });
    expect(receipt.blockedEffects[0]?.blockerCodes).toContain(
      "reduction_not_certified",
    );

    const duplicateSource = structuredClone(protocol);
    duplicateSource.reductions[1].sourceSystem = "personality_interaction_144";
    expect(() => probabilityFlowProtocolSchema.parse(duplicateSource)).toThrow(
      "sources cannot be merged",
    );
  });

  it("raises uncertainty and transitively revokes observer dependents", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.observers[0].observedAt = "2026-07-13T10:00:00.000Z";
    protocol.observers[0].expiresAt = "2026-07-13T11:59:59.000Z";

    const receipt = resolveProbabilityFlow(protocol, now);

    expect(receipt.adjustedUncertainty).toBeCloseTo(0.3);
    expect(receipt.invalidatedNodeIds).toEqual(
      expect.arrayContaining([
        "observer-current-consent",
        "evidence-current-consent",
        "plan-repair-message",
        "certificate-care-boundary",
        "lease-repair-message",
      ]),
    );
    expect(receipt.blockedEffects[0]).toMatchObject({
      effectId: "effect-draft-repair-message",
      blockerCodes: expect.arrayContaining(["observer_dependency_revoked"]),
    });
  });

  it("treats care as an autonomy constraint, never as attachment utility", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.principals[1].rightToExit = false;
    protocol.careFlow = protocol.careFlow.map((sample) => ({
      ...sample,
      care: 1,
      commitment: 1,
      repair: 1,
    }));

    const receipt = resolveProbabilityFlow(protocol, now);

    expect(receipt.autonomyResult.allowed).toBe(false);
    expect(receipt.autonomyResult.blockers[0]).toContain("right to exit");
    expect(receipt.blockedEffects[0]).toMatchObject({
      effectId: "effect-draft-repair-message",
      blockerCodes: expect.arrayContaining(["autonomy_constraint_failed"]),
    });
  });

  it("replays a complete lineage and detects tampering", () => {
    const protocol = applyProbabilityFlowResolution(
      createInitialProbabilityFlowProtocol(now),
      now,
    );
    const receipt = protocol.receipts[0];

    expect(verifyProbabilityFlowReplay(protocol, receipt)).toEqual({
      ok: true,
      reasons: [],
    });

    const tampered = structuredClone(protocol);
    tampered.actions[0].tailRisk = 0.77;
    const replay = verifyProbabilityFlowReplay(tampered, receipt);
    expect(replay.ok).toBe(false);
    expect(replay.reasons).toHaveLength(2);
  });

  it("emits an order-stable, receipt-free proof bundle for signed adoption", () => {
    const protocol = applyProbabilityFlowResolution(
      createInitialProbabilityFlowProtocol(now),
      now,
    );
    const receipt = protocol.receipts[0];
    const canonical = canonicalizeProbabilityFlowInput(protocol);
    const bundle = createProbabilityFlowProofBundle(protocol, receipt);

    expect(bundle.receipt.inputDigest).toBe("ipf-fnv1a64-72062089339a8d0d");
    expect(createHash("sha256").update(canonical).digest("hex")).toBe(
      "ec3eba97e086e86291c9e98a8bad71834d04379fb9447196d44de770be6bb29b",
    );
    expect(canonical).not.toContain('"receipts"');
    expect(Object.keys(bundle)).toEqual([
      "bundleVersion",
      "canonicalization",
      "protocolInput",
      "receipt",
    ]);
    expect(verifyProbabilityFlowProofBundle(bundle)).toEqual({
      ok: true,
      reasons: [],
    });

    const reordered = {
      receipts: protocol.receipts,
      ...Object.fromEntries(Object.entries(protocol).reverse()),
    } as typeof protocol;
    expect(canonicalizeProbabilityFlowInput(reordered)).toBe(canonical);

    const tampered = structuredClone(bundle);
    tampered.protocolInput.actions[0].tailRisk = 0.99;
    expect(verifyProbabilityFlowProofBundle(tampered).ok).toBe(false);
    expect(
      verifyProbabilityFlowProofBundle({ ...bundle, unsignedExtension: true })
        .ok,
    ).toBe(false);
  });

  it("reinterprets memory without mutating the historical fact", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    const originalEvent = protocol.memoryEvents[0];
    const reinterpreted = reinterpretMemoryEvent(
      protocol,
      originalEvent.id,
      "The same event is now interpreted as a bounded request for repair.",
    );

    expect(reinterpreted.memoryEvents[0].immutableFactDigest).toBe(
      originalEvent.immutableFactDigest,
    );
    expect(reinterpreted.memoryEvents[0].interpretationRevision).toBe(2);
    expect(reinterpreted.memoryEvents[0].interpretation).not.toBe(
      originalEvent.interpretation,
    );
  });

  it("closes action dependencies before authorizing a dependent effect", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.actions.push({
      ...structuredClone(protocol.actions[0]),
      id: "effect-review-repair-message",
      label: "Review the bounded repair message",
      dependsOnActions: ["effect-draft-repair-message"],
    });

    const allowed = resolveProbabilityFlow(protocol, now);
    expect(allowed.authorizedEffectIds).toEqual([
      "effect-draft-repair-message",
      "effect-review-repair-message",
    ]);

    protocol.actions[0].authorized = false;
    const blocked = resolveProbabilityFlow(protocol, now);
    expect(
      blocked.blockedEffects.find(
        (effect) => effect.effectId === "effect-review-repair-message",
      )?.blockerCodes,
    ).toContain("action_dependency_blocked");
  });

  it("rejects dangling protocol references instead of failing open", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.actions[0].dependencyNodeIds = ["lease-does-not-exist"];

    expect(() => probabilityFlowProtocolSchema.parse(protocol)).toThrow(
      "Unknown dependency-node reference",
    );
  });

  it("requires relationship effects to name both autonomy principals", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.actions[0].principalIds = ["principal-self"];

    expect(() => probabilityFlowProtocolSchema.parse(protocol)).toThrow(
      "Relationship effects must name both protocol principals",
    );
  });

  it("rejects circular dependency-node evidence chains", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.dependencyNodes[0].dependsOn = ["plan-repair-message"];

    expect(() => probabilityFlowProtocolSchema.parse(protocol)).toThrow(
      "circular evidence cannot warrant itself",
    );
  });

  it("retains the cycle blocker across an action dependency loop", () => {
    const protocol = createInitialProbabilityFlowProtocol(now);
    protocol.actions.push({
      ...structuredClone(protocol.actions[0]),
      id: "effect-review-repair-message",
      label: "Review the bounded repair message",
      dependsOnActions: ["effect-draft-repair-message"],
    });
    protocol.actions[0].dependsOnActions = ["effect-review-repair-message"];

    const receipt = resolveProbabilityFlow(protocol, now);

    for (const effectId of [
      "effect-draft-repair-message",
      "effect-review-repair-message",
    ]) {
      expect(
        receipt.blockedEffects.find((effect) => effect.effectId === effectId)
          ?.blockerCodes,
      ).toEqual(
        expect.arrayContaining([
          "action_dependency_blocked",
          "action_dependency_cycle",
        ]),
      );
    }
  });
});
