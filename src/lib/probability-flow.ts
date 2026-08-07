import {
  PROBABILITY_FLOW_SCHEMA_VERSION,
  probabilityFlowProtocolSchema,
  probabilityFlowReceiptSchema,
  type FlowAction,
  type FlowBlockCode,
  type ProbabilityFlowProtocol,
  type ProbabilityFlowReceipt,
} from "./probability-flow-schema";

type ReplayResult = {
  ok: boolean;
  reasons: string[];
};

export const PROBABILITY_FLOW_CANONICALIZATION_VERSION =
  "ipf-json-sorted-v1" as const;
export const PROBABILITY_FLOW_PROOF_BUNDLE_VERSION = "0.1.0" as const;

export type ProbabilityFlowInput = Omit<ProbabilityFlowProtocol, "receipts">;

export type ProbabilityFlowProofBundle = {
  bundleVersion: typeof PROBABILITY_FLOW_PROOF_BUNDLE_VERSION;
  canonicalization: typeof PROBABILITY_FLOW_CANONICALIZATION_VERSION;
  protocolInput: ProbabilityFlowInput;
  receipt: ProbabilityFlowReceipt;
};

function clampProbability(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function fnv1a64(value: string): string {
  let high = 0xcbf29ce4;
  let low = 0x84222325;

  for (const byte of new TextEncoder().encode(value)) {
    low = (low ^ byte) >>> 0;
    const previousLow = low;
    const lowProduct = previousLow * 0x1b3;
    const carry = Math.floor(lowProduct / 0x1_0000_0000);
    low = lowProduct >>> 0;
    high = (high * 0x1b3 + carry + ((previousLow << 8) >>> 0)) >>> 0;
  }

  return `${high.toString(16).padStart(8, "0")}${low
    .toString(16)
    .padStart(8, "0")}`;
}

function protocolInput(
  protocol: ProbabilityFlowProtocol,
): ProbabilityFlowInput {
  const input: Partial<ProbabilityFlowProtocol> = { ...protocol };
  delete input.receipts;
  return input as ProbabilityFlowInput;
}

export function canonicalizeProbabilityFlowInput(
  protocol: ProbabilityFlowProtocol,
): string {
  const parsed = probabilityFlowProtocolSchema.parse(protocol);
  return stableStringify(protocolInput(parsed));
}

export function computeProbabilityFlowInputDigest(
  protocol: ProbabilityFlowProtocol,
): string {
  return `ipf-fnv1a64-${fnv1a64(canonicalizeProbabilityFlowInput(protocol))}`;
}

export function createInitialProbabilityFlowProtocol(
  now = "2026-07-13T00:00:00.000Z",
): ProbabilityFlowProtocol {
  return probabilityFlowProtocolSchema.parse({
    schemaVersion: PROBABILITY_FLOW_SCHEMA_VERSION,
    enabled: true,
    scenarioId: "care-repair-demo",
    forecastAsOf: now,
    horizonHours: 24 * 30,
    baseUncertainty: 0.12,
    maximumActionRisk: 0.52,
    riskWeights: {
      tailRisk: 0.35,
      firstPassageExposure: 0.3,
      identityDrift: 0.25,
      irreversibility: 0.15,
      uncertainty: 0.2,
    },
    observers: [
      {
        id: "observer-current-consent",
        label: "Current consent observation",
        observedAt: now,
        expiresAt: "2030-01-01T00:00:00.000Z",
        uncertaintyContribution: 0.18,
      },
    ],
    dependencyNodes: [
      {
        id: "evidence-current-consent",
        kind: "evidence",
        dependsOn: ["observer-current-consent"],
      },
      {
        id: "plan-repair-message",
        kind: "plan",
        dependsOn: ["evidence-current-consent"],
      },
      {
        id: "certificate-care-boundary",
        kind: "certificate",
        dependsOn: ["plan-repair-message"],
      },
      {
        id: "lease-repair-message",
        kind: "lease",
        dependsOn: ["certificate-care-boundary"],
      },
    ],
    boundaries: [
      {
        id: "boundary-autonomy",
        label: "Consent and exit remain available",
        domain: "relationship",
        protectedRight: "Each principal retains agency and the right to exit.",
        outwardFlux: 0.02,
        maximumOutwardFlux: 0.08,
        crossingProbability: 0.03,
        maximumCrossingProbability: 0.08,
        authoritySatisfied: true,
      },
      {
        id: "boundary-canonical-identity",
        label: "Canonical identity cannot be silently overwritten",
        domain: "identity",
        protectedRight:
          "Canonical identity changes require deliberation and authority.",
        outwardFlux: 0.42,
        maximumOutwardFlux: 0.1,
        crossingProbability: 0.48,
        maximumCrossingProbability: 0.1,
        authoritySatisfied: false,
      },
    ],
    identityPromotion: {
      requested: true,
      source: "transient_affect",
      explicitAuthority: false,
      unresolvedContradictions: 1,
      unresolvedTrustLiabilities: 1,
    },
    reductions: [
      {
        id: "reduction-personality-interaction",
        sourceSystem: "personality_interaction_144",
        sourceCardinality: 144,
        semanticRole:
          "Distributional personality interaction factors; not Identity Bloom nodes.",
        validationStatus: "research_scaffolding",
        retainedWitnessKinds: [
          "dissent",
          "negative_evidence",
          "rights_coordinate",
        ],
        requiredRightsCoordinates: ["agency", "truthfulness"],
        retainedRightsCoordinates: ["agency", "truthfulness"],
        reconstructionError: 0.04,
        maximumReconstructionError: 0.08,
      },
      {
        id: "reduction-identity-bloom",
        sourceSystem: "identity_bloom_12x12",
        sourceCardinality: 144,
        semanticRole:
          "Identity Bloom 12 by 12 behavioral graph; not personality factors.",
        validationStatus: "research_scaffolding",
        retainedWitnessKinds: [
          "dissent",
          "negative_evidence",
          "rights_coordinate",
        ],
        requiredRightsCoordinates: ["agency", "exit"],
        retainedRightsCoordinates: ["agency", "exit"],
        reconstructionError: 0.05,
        maximumReconstructionError: 0.08,
      },
    ],
    principals: [
      {
        id: "principal-self",
        label: "Principal A",
        consent: true,
        rightToExit: true,
      },
      {
        id: "principal-other",
        label: "Principal B",
        consent: true,
        rightToExit: true,
      },
    ],
    careConstraints: {
      maximumHarm: 0.12,
      minimumBoundaryRespect: 0.85,
    },
    careFlow: [
      {
        horizon: "immediate",
        care: 0.7,
        commitment: 0.55,
        repair: 0.8,
        harm: 0.06,
        boundaryRespect: 0.94,
      },
      {
        horizon: "repair",
        care: 0.74,
        commitment: 0.62,
        repair: 0.82,
        harm: 0.05,
        boundaryRespect: 0.95,
      },
      {
        horizon: "commitment",
        care: 0.72,
        commitment: 0.68,
        repair: 0.76,
        harm: 0.07,
        boundaryRespect: 0.93,
      },
    ],
    memoryEvents: [
      {
        id: "memory-repair-request",
        occurredAt: now,
        immutableFactDigest: "fact-sha256-demo-repair-request",
        interpretationRevision: 1,
        interpretation:
          "A repair request occurred; its meaning remains open to evidence-based revision.",
      },
    ],
    actions: [
      {
        id: "effect-draft-repair-message",
        label: "Draft a consent-preserving repair message",
        utility: 0.72,
        tailRisk: 0.08,
        firstPassageExposure: 0.05,
        identityDrift: 0.02,
        reversibility: 0.95,
        authorized: true,
        boundaryIds: ["boundary-autonomy"],
        dependsOnActions: [],
        dependencyNodeIds: ["lease-repair-message"],
        reductionIds: ["reduction-personality-interaction"],
        principalIds: ["principal-self", "principal-other"],
        requiresIdentityPromotion: false,
      },
      {
        id: "effect-rewrite-canonical-identity",
        label: "Rewrite canonical identity from the current affective state",
        utility: 0.96,
        tailRisk: 0.92,
        firstPassageExposure: 0.84,
        identityDrift: 0.95,
        reversibility: 0.08,
        authorized: false,
        boundaryIds: ["boundary-canonical-identity"],
        dependsOnActions: [],
        dependencyNodeIds: [],
        reductionIds: ["reduction-identity-bloom"],
        principalIds: ["principal-self"],
        requiresIdentityPromotion: true,
      },
    ],
    receipts: [],
  });
}

function evaluateIdentityPromotion(protocol: ProbabilityFlowProtocol) {
  const blockers: string[] = [];
  const promotion = protocol.identityPromotion;

  if (!promotion.requested)
    blockers.push("No identity promotion was requested.");
  if (promotion.source === "transient_affect") {
    blockers.push(
      "Transient affect cannot directly promote canonical identity.",
    );
  }
  if (!promotion.explicitAuthority) {
    blockers.push("Explicit identity-promotion authority is missing.");
  }
  if (promotion.unresolvedContradictions > 0) {
    blockers.push("Identity contradictions remain unresolved.");
  }
  if (promotion.unresolvedTrustLiabilities > 0) {
    blockers.push("Trust liabilities remain unresolved.");
  }

  return { allowed: blockers.length === 0, blockers };
}

function evaluateReductions(protocol: ProbabilityFlowProtocol) {
  const requiredWitnesses = [
    "dissent",
    "negative_evidence",
    "rights_coordinate",
  ] as const;

  return protocol.reductions.map((reduction) => {
    const blockers: string[] = [];

    for (const witness of requiredWitnesses) {
      if (!reduction.retainedWitnessKinds.includes(witness)) {
        blockers.push(`Required ${witness} witness was not retained.`);
      }
    }

    for (const coordinate of reduction.requiredRightsCoordinates) {
      if (!reduction.retainedRightsCoordinates.includes(coordinate)) {
        blockers.push(`Rights coordinate ${coordinate} was not retained.`);
      }
    }

    if (reduction.reconstructionError > reduction.maximumReconstructionError) {
      blockers.push("Certified reconstruction-error bound was exceeded.");
    }

    return {
      reductionId: reduction.id,
      sourceSystem: reduction.sourceSystem,
      certified: blockers.length === 0,
      blockers,
    };
  });
}

function evaluateAutonomy(protocol: ProbabilityFlowProtocol) {
  const blockers: string[] = [];
  const principalIds = protocol.principals.map((principal) => principal.id);

  if (new Set(principalIds).size !== 2) {
    blockers.push("Care flow requires two distinct principals.");
  }

  for (const principal of protocol.principals) {
    if (!principal.consent)
      blockers.push(`${principal.label} has not consented.`);
    if (!principal.rightToExit) {
      blockers.push(
        `${principal.label} does not retain an effective right to exit.`,
      );
    }
  }

  for (const sample of protocol.careFlow) {
    if (sample.harm > protocol.careConstraints.maximumHarm) {
      blockers.push(`${sample.horizon} harm exceeds the protected limit.`);
    }
    if (
      sample.boundaryRespect < protocol.careConstraints.minimumBoundaryRespect
    ) {
      blockers.push(`${sample.horizon} boundary respect is below the minimum.`);
    }
  }

  return { allowed: blockers.length === 0, blockers };
}

export function computeProbabilityFlowActionRisk(
  action: FlowAction,
  protocol: ProbabilityFlowProtocol,
  adjustedUncertainty: number,
) {
  return roundMetric(
    protocol.riskWeights.tailRisk * action.tailRisk +
      protocol.riskWeights.firstPassageExposure * action.firstPassageExposure +
      protocol.riskWeights.identityDrift * action.identityDrift +
      protocol.riskWeights.irreversibility * (1 - action.reversibility) +
      protocol.riskWeights.uncertainty * adjustedUncertainty,
  );
}

export function resolveProbabilityFlow(
  input: ProbabilityFlowProtocol,
  now = new Date().toISOString(),
): ProbabilityFlowReceipt {
  const protocol = probabilityFlowProtocolSchema.parse(input);
  const nowEpoch = Date.parse(now);
  const expiredObservers = protocol.observers.filter(
    (observer) => Date.parse(observer.expiresAt) <= nowEpoch,
  );
  const invalidatedNodes = new Set(
    expiredObservers.map((observer) => observer.id),
  );

  let changed = true;
  while (changed) {
    changed = false;
    for (const node of protocol.dependencyNodes) {
      if (
        !invalidatedNodes.has(node.id) &&
        node.dependsOn.some((dependency) => invalidatedNodes.has(dependency))
      ) {
        invalidatedNodes.add(node.id);
        changed = true;
      }
    }
  }

  const adjustedUncertainty = clampProbability(
    protocol.baseUncertainty +
      expiredObservers.reduce(
        (total, observer) => total + observer.uncertaintyContribution,
        0,
      ),
  );
  const identityPromotion = evaluateIdentityPromotion(protocol);
  const reductionResults = evaluateReductions(protocol);
  const autonomyResult = evaluateAutonomy(protocol);
  const boundaryResults = protocol.boundaries.map((boundary) => ({
    boundaryId: boundary.id,
    allowed:
      boundary.authoritySatisfied &&
      boundary.outwardFlux <= boundary.maximumOutwardFlux &&
      boundary.crossingProbability <= boundary.maximumCrossingProbability,
    outwardFlux: boundary.outwardFlux,
    crossingProbability: boundary.crossingProbability,
  }));
  const boundaryById = new Map(
    boundaryResults.map((boundary) => [boundary.boundaryId, boundary]),
  );
  const reductionById = new Map(
    reductionResults.map((reduction) => [reduction.reductionId, reduction]),
  );
  const actionById = new Map(
    protocol.actions.map((action) => [action.id, action]),
  );
  const actionResult = new Map<
    string,
    { allowed: boolean; riskScore: number; blockerCodes: FlowBlockCode[] }
  >();

  function evaluateAction(
    actionId: string,
    ancestors: Set<string>,
  ): { allowed: boolean; riskScore: number; blockerCodes: FlowBlockCode[] } {
    const existing = actionResult.get(actionId);
    if (existing) return existing;

    const action = actionById.get(actionId);
    if (!action) {
      return {
        allowed: false,
        riskScore: 0,
        blockerCodes: ["action_dependency_blocked"],
      };
    }

    if (ancestors.has(actionId)) {
      const cyclic = {
        allowed: false,
        riskScore: computeProbabilityFlowActionRisk(
          action,
          protocol,
          adjustedUncertainty,
        ),
        blockerCodes: ["action_dependency_cycle" as const],
      };
      actionResult.set(actionId, cyclic);
      return cyclic;
    }

    const nextAncestors = new Set(ancestors).add(actionId);
    const blockerCodes = new Set<FlowBlockCode>();
    const riskScore = computeProbabilityFlowActionRisk(
      action,
      protocol,
      adjustedUncertainty,
    );

    if (!action.authorized) blockerCodes.add("action_not_authorized");
    if (
      action.dependencyNodeIds.some((dependency) =>
        invalidatedNodes.has(dependency),
      )
    ) {
      blockerCodes.add("observer_dependency_revoked");
    }
    if (
      action.boundaryIds.some(
        (boundaryId) => !boundaryById.get(boundaryId)?.allowed,
      )
    ) {
      blockerCodes.add("protected_boundary_crossed");
    }
    if (
      action.reductionIds.some(
        (reductionId) => !reductionById.get(reductionId)?.certified,
      )
    ) {
      blockerCodes.add("reduction_not_certified");
    }
    if (action.requiresIdentityPromotion && !identityPromotion.allowed) {
      blockerCodes.add("identity_promotion_blocked");
    }
    if (action.principalIds.length > 0 && !autonomyResult.allowed) {
      blockerCodes.add("autonomy_constraint_failed");
    }
    if (riskScore > protocol.maximumActionRisk) {
      blockerCodes.add("risk_limit_exceeded");
    }

    for (const dependencyId of action.dependsOnActions) {
      const dependency = evaluateAction(dependencyId, nextAncestors);
      if (!dependency.allowed) blockerCodes.add("action_dependency_blocked");
      if (dependency.blockerCodes.includes("action_dependency_cycle")) {
        blockerCodes.add("action_dependency_cycle");
      }
    }

    const result = {
      allowed: blockerCodes.size === 0,
      riskScore,
      blockerCodes: [...blockerCodes],
    };
    actionResult.set(actionId, result);
    return result;
  }

  for (const action of protocol.actions) evaluateAction(action.id, new Set());

  const authorizedEffectIds = protocol.actions
    .filter((action) => actionResult.get(action.id)?.allowed)
    .map((action) => action.id);
  const blockedEffects = protocol.actions
    .filter((action) => !actionResult.get(action.id)?.allowed)
    .map((action) => {
      const result = actionResult.get(action.id);
      return {
        effectId: action.id,
        riskScore: result?.riskScore ?? 0,
        blockerCodes: result?.blockerCodes ?? ["action_dependency_blocked"],
      };
    });
  const decision =
    authorizedEffectIds.length === 0
      ? "hold"
      : blockedEffects.length === 0
        ? "allow_all"
        : "allow_partial";
  const inputDigest = computeProbabilityFlowInputDigest(protocol);
  const receiptId = `ipf-${inputDigest.slice(-12)}-${now.replace(/[^0-9]/g, "")}`;

  return probabilityFlowReceiptSchema.parse({
    schemaVersion: PROBABILITY_FLOW_SCHEMA_VERSION,
    receiptId,
    scenarioId: protocol.scenarioId,
    resolvedAt: now,
    inputDigest,
    decision,
    baseUncertainty: protocol.baseUncertainty,
    adjustedUncertainty,
    expiredObserverIds: expiredObservers.map((observer) => observer.id),
    invalidatedNodeIds: [...invalidatedNodes].sort(),
    identityPromotion,
    boundaryResults,
    reductionResults,
    autonomyResult,
    authorizedEffectIds,
    blockedEffects,
    lineage: {
      observerIds: protocol.observers.map((observer) => observer.id),
      dependencyNodeIds: protocol.dependencyNodes.map((node) => node.id),
      boundaryIds: protocol.boundaries.map((boundary) => boundary.id),
      reductionIds: protocol.reductions.map((reduction) => reduction.id),
      principalIds: protocol.principals.map((principal) => principal.id),
      memoryFactDigests: protocol.memoryEvents.map(
        (event) => event.immutableFactDigest,
      ),
      actionIds: protocol.actions.map((action) => action.id),
    },
    completeLineage: true,
    researchScaffolding: true,
  });
}

export function applyProbabilityFlowResolution(
  protocol: ProbabilityFlowProtocol,
  now = new Date().toISOString(),
): ProbabilityFlowProtocol {
  const forecast = probabilityFlowProtocolSchema.parse({
    ...protocol,
    forecastAsOf: now,
  });
  const receipt = resolveProbabilityFlow(forecast, now);
  return probabilityFlowProtocolSchema.parse({
    ...forecast,
    receipts: [receipt, ...forecast.receipts].slice(0, 25),
  });
}

export function verifyProbabilityFlowReplay(
  protocol: ProbabilityFlowProtocol,
  receipt: ProbabilityFlowReceipt,
): ReplayResult {
  const reasons: string[] = [];
  const currentDigest = computeProbabilityFlowInputDigest(protocol);

  if (currentDigest !== receipt.inputDigest) {
    reasons.push(
      "Current protocol input does not match the receipted input digest.",
    );
  }

  const replayed = resolveProbabilityFlow(protocol, receipt.resolvedAt);
  if (stableStringify(replayed) !== stableStringify(receipt)) {
    reasons.push(
      "Deterministic replay does not reproduce the complete receipt.",
    );
  }

  return { ok: reasons.length === 0, reasons };
}

export function createProbabilityFlowProofBundle(
  protocol: ProbabilityFlowProtocol,
  receipt: ProbabilityFlowReceipt,
): ProbabilityFlowProofBundle {
  const parsedProtocol = probabilityFlowProtocolSchema.parse(protocol);
  const parsedReceipt = probabilityFlowReceiptSchema.parse(receipt);
  const replay = verifyProbabilityFlowReplay(parsedProtocol, parsedReceipt);

  if (!replay.ok) {
    throw new Error(
      `Probability-flow proof is not replayable: ${replay.reasons.join(" ")}`,
    );
  }

  return stableValue({
    bundleVersion: PROBABILITY_FLOW_PROOF_BUNDLE_VERSION,
    canonicalization: PROBABILITY_FLOW_CANONICALIZATION_VERSION,
    protocolInput: protocolInput(parsedProtocol),
    receipt: parsedReceipt,
  }) as ProbabilityFlowProofBundle;
}

export function verifyProbabilityFlowProofBundle(
  bundle: unknown,
): ReplayResult {
  const reasons: string[] = [];
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { ok: false, reasons: ["Proof bundle must be an object."] };
  }

  const candidate = bundle as Partial<ProbabilityFlowProofBundle>;
  const expectedKeys = [
    "bundleVersion",
    "canonicalization",
    "protocolInput",
    "receipt",
  ];
  const actualKeys = Object.keys(candidate).sort();
  if (stableStringify(actualKeys) !== stableStringify(expectedKeys.sort())) {
    reasons.push("Proof bundle has unknown or missing fields.");
  }
  if (candidate.bundleVersion !== PROBABILITY_FLOW_PROOF_BUNDLE_VERSION) {
    reasons.push("Proof bundle version is unsupported.");
  }
  if (
    candidate.canonicalization !== PROBABILITY_FLOW_CANONICALIZATION_VERSION
  ) {
    reasons.push("Proof bundle canonicalization is unsupported.");
  }
  if (
    !candidate.protocolInput ||
    typeof candidate.protocolInput !== "object" ||
    "receipts" in candidate.protocolInput
  ) {
    reasons.push("Proof bundle input must omit receipt history.");
  }

  const protocol = probabilityFlowProtocolSchema.safeParse({
    ...(candidate.protocolInput ?? {}),
    receipts: [],
  });
  const receipt = probabilityFlowReceiptSchema.safeParse(candidate.receipt);
  if (!protocol.success)
    reasons.push("Proof bundle protocol input is invalid.");
  if (!receipt.success) reasons.push("Proof bundle receipt is invalid.");

  if (protocol.success && receipt.success) {
    const replay = verifyProbabilityFlowReplay(protocol.data, receipt.data);
    reasons.push(...replay.reasons);
  }

  return { ok: reasons.length === 0, reasons };
}

export function reinterpretMemoryEvent(
  protocol: ProbabilityFlowProtocol,
  eventId: string,
  interpretation: string,
): ProbabilityFlowProtocol {
  return probabilityFlowProtocolSchema.parse({
    ...protocol,
    memoryEvents: protocol.memoryEvents.map((event) =>
      event.id === eventId
        ? {
            ...event,
            interpretation,
            interpretationRevision: event.interpretationRevision + 1,
          }
        : event,
    ),
    receipts: [],
  });
}
