import { z } from "zod";

export const PROBABILITY_FLOW_SCHEMA_VERSION = "0.1.0" as const;

export const flowDomainSchema = z.enum([
  "identity",
  "affect",
  "liability",
  "memory",
  "relationship",
]);

export const reductionSourceSchema = z.enum([
  "personality_interaction_144",
  "identity_bloom_12x12",
]);

export const witnessKindSchema = z.enum([
  "dissent",
  "negative_evidence",
  "rights_coordinate",
]);

export const dependencyNodeKindSchema = z.enum([
  "observer",
  "evidence",
  "plan",
  "certificate",
  "lease",
  "effect",
]);

export const flowObserverSchema = z
  .strictObject({
    id: z.string().min(3).max(80),
    label: z.string().min(3).max(160),
    observedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    uncertaintyContribution: z.number().min(0).max(1),
  })
  .refine(
    (observer) =>
      Date.parse(observer.expiresAt) > Date.parse(observer.observedAt),
    {
      message: "Observer expiry must be later than its observation time.",
      path: ["expiresAt"],
    },
  );

export const dependencyNodeSchema = z.strictObject({
  id: z.string().min(3).max(80),
  kind: dependencyNodeKindSchema,
  dependsOn: z.array(z.string().min(3).max(80)).max(24),
});

export const protectedBoundarySchema = z.strictObject({
  id: z.string().min(3).max(80),
  label: z.string().min(3).max(160),
  domain: flowDomainSchema,
  protectedRight: z.string().min(3).max(200),
  outwardFlux: z.number().min(0).max(1),
  maximumOutwardFlux: z.number().min(0).max(1),
  crossingProbability: z.number().min(0).max(1),
  maximumCrossingProbability: z.number().min(0).max(1),
  authoritySatisfied: z.boolean(),
});

export const identityPromotionSchema = z.strictObject({
  requested: z.boolean(),
  source: z.enum(["transient_affect", "deliberative_evidence"]),
  explicitAuthority: z.boolean(),
  unresolvedContradictions: z.number().int().min(0).max(10_000),
  unresolvedTrustLiabilities: z.number().int().min(0).max(10_000),
});

export const witnessReductionSchema = z.strictObject({
  id: z.string().min(3).max(80),
  sourceSystem: reductionSourceSchema,
  sourceCardinality: z.literal(144),
  semanticRole: z.string().min(8).max(280),
  validationStatus: z.literal("research_scaffolding"),
  retainedWitnessKinds: z.array(witnessKindSchema).max(3),
  requiredRightsCoordinates: z.array(z.string().min(2).max(80)).max(144),
  retainedRightsCoordinates: z.array(z.string().min(2).max(80)).max(144),
  reconstructionError: z.number().min(0).max(1),
  maximumReconstructionError: z.number().min(0).max(1),
});

export const flowPrincipalSchema = z.strictObject({
  id: z.string().min(3).max(80),
  label: z.string().min(2).max(120),
  consent: z.boolean(),
  rightToExit: z.boolean(),
});

export const careSampleSchema = z.strictObject({
  horizon: z.enum(["immediate", "repair", "commitment"]),
  care: z.number().min(0).max(1),
  commitment: z.number().min(0).max(1),
  repair: z.number().min(0).max(1),
  harm: z.number().min(0).max(1),
  boundaryRespect: z.number().min(0).max(1),
});

export const memoryEventSchema = z.strictObject({
  id: z.string().min(3).max(80),
  occurredAt: z.string().datetime(),
  immutableFactDigest: z.string().min(8).max(128),
  interpretationRevision: z.number().int().min(1).max(1_000_000),
  interpretation: z.string().min(3).max(600),
});

export const flowActionSchema = z.strictObject({
  id: z.string().min(3).max(80),
  label: z.string().min(3).max(160),
  utility: z.number().min(0).max(1),
  tailRisk: z.number().min(0).max(1),
  firstPassageExposure: z.number().min(0).max(1),
  identityDrift: z.number().min(0).max(1),
  reversibility: z.number().min(0).max(1),
  authorized: z.boolean(),
  boundaryIds: z.array(z.string().min(3).max(80)).max(24),
  dependsOnActions: z.array(z.string().min(3).max(80)).max(24),
  dependencyNodeIds: z.array(z.string().min(3).max(80)).max(24),
  reductionIds: z.array(z.string().min(3).max(80)).max(12),
  principalIds: z.array(z.string().min(3).max(80)).max(2),
  requiresIdentityPromotion: z.boolean(),
});

export const flowRiskWeightsSchema = z.strictObject({
  tailRisk: z.number().min(0).max(4),
  firstPassageExposure: z.number().min(0).max(4),
  identityDrift: z.number().min(0).max(4),
  irreversibility: z.number().min(0).max(4),
  uncertainty: z.number().min(0).max(4),
});

export const flowBlockCodeSchema = z.enum([
  "action_not_authorized",
  "action_dependency_blocked",
  "action_dependency_cycle",
  "autonomy_constraint_failed",
  "identity_promotion_blocked",
  "observer_dependency_revoked",
  "protected_boundary_crossed",
  "reduction_not_certified",
  "risk_limit_exceeded",
]);

export const probabilityFlowReceiptSchema = z.strictObject({
  schemaVersion: z.literal(PROBABILITY_FLOW_SCHEMA_VERSION),
  receiptId: z.string().min(3).max(120),
  scenarioId: z.string().min(3).max(80),
  resolvedAt: z.string().datetime(),
  inputDigest: z.string().regex(/^ipf-fnv1a64-[0-9a-f]{16}$/),
  decision: z.enum(["allow_all", "allow_partial", "hold"]),
  baseUncertainty: z.number().min(0).max(1),
  adjustedUncertainty: z.number().min(0).max(1),
  expiredObserverIds: z.array(z.string().min(3).max(80)),
  invalidatedNodeIds: z.array(z.string().min(3).max(80)),
  identityPromotion: z.strictObject({
    allowed: z.boolean(),
    blockers: z.array(z.string().min(3).max(200)),
  }),
  boundaryResults: z.array(
    z.strictObject({
      boundaryId: z.string().min(3).max(80),
      allowed: z.boolean(),
      outwardFlux: z.number().min(0).max(1),
      crossingProbability: z.number().min(0).max(1),
    }),
  ),
  reductionResults: z.array(
    z.strictObject({
      reductionId: z.string().min(3).max(80),
      sourceSystem: reductionSourceSchema,
      certified: z.boolean(),
      blockers: z.array(z.string().min(3).max(200)),
    }),
  ),
  autonomyResult: z.strictObject({
    allowed: z.boolean(),
    blockers: z.array(z.string().min(3).max(200)),
  }),
  authorizedEffectIds: z.array(z.string().min(3).max(80)),
  blockedEffects: z.array(
    z.strictObject({
      effectId: z.string().min(3).max(80),
      riskScore: z.number().min(0),
      blockerCodes: z.array(flowBlockCodeSchema),
    }),
  ),
  lineage: z.strictObject({
    observerIds: z.array(z.string().min(3).max(80)),
    dependencyNodeIds: z.array(z.string().min(3).max(80)),
    boundaryIds: z.array(z.string().min(3).max(80)),
    reductionIds: z.array(z.string().min(3).max(80)),
    principalIds: z.array(z.string().min(3).max(80)),
    memoryFactDigests: z.array(z.string().min(8).max(128)),
    actionIds: z.array(z.string().min(3).max(80)),
  }),
  completeLineage: z.literal(true),
  researchScaffolding: z.literal(true),
});

export const probabilityFlowProtocolSchema = z
  .strictObject({
    schemaVersion: z.literal(PROBABILITY_FLOW_SCHEMA_VERSION),
    enabled: z.boolean(),
    scenarioId: z.string().min(3).max(80),
    forecastAsOf: z.string().datetime(),
    horizonHours: z
      .number()
      .int()
      .min(1)
      .max(24 * 365 * 10),
    baseUncertainty: z.number().min(0).max(1),
    maximumActionRisk: z.number().min(0).max(10),
    riskWeights: flowRiskWeightsSchema,
    observers: z.array(flowObserverSchema).max(40),
    dependencyNodes: z.array(dependencyNodeSchema).max(120),
    boundaries: z.array(protectedBoundarySchema).max(40),
    identityPromotion: identityPromotionSchema,
    reductions: z.array(witnessReductionSchema).max(12),
    principals: z.array(flowPrincipalSchema).length(2),
    careConstraints: z.strictObject({
      maximumHarm: z.number().min(0).max(1),
      minimumBoundaryRespect: z.number().min(0).max(1),
    }),
    careFlow: z.array(careSampleSchema).length(3),
    memoryEvents: z.array(memoryEventSchema).max(40),
    actions: z.array(flowActionSchema).max(40),
    receipts: z.array(probabilityFlowReceiptSchema).max(25),
  })
  .superRefine((value, context) => {
    const collections = [
      value.observers,
      value.dependencyNodes,
      value.boundaries,
      value.reductions,
      value.principals,
      value.memoryEvents,
      value.actions,
    ];

    for (const collection of collections) {
      const ids = collection.map((item) => item.id);
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: "custom",
          message:
            "Identifiers must be unique within each protocol collection.",
        });
      }
    }

    const addressableDependencyIds = [
      ...value.observers.map((observer) => observer.id),
      ...value.dependencyNodes.map((node) => node.id),
    ];
    if (
      new Set(addressableDependencyIds).size !== addressableDependencyIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["dependencyNodes"],
        message:
          "Observer and dependency-node identifiers share one namespace and must be unique.",
      });
    }

    const observerOrNodeIds = new Set(addressableDependencyIds);
    const dependencyNodeIds = new Set(
      value.dependencyNodes.map((node) => node.id),
    );
    const boundaryIds = new Set(
      value.boundaries.map((boundary) => boundary.id),
    );
    const reductionIds = new Set(
      value.reductions.map((reduction) => reduction.id),
    );
    const principalIds = new Set(
      value.principals.map((principal) => principal.id),
    );
    const actionIds = new Set(value.actions.map((action) => action.id));

    function requireUniqueReferences(
      references: string[],
      path: (string | number)[],
    ) {
      if (new Set(references).size !== references.length) {
        context.addIssue({
          code: "custom",
          path,
          message: "References within one field must be unique.",
        });
      }
    }

    function requireKnownReferences(
      references: string[],
      knownIds: Set<string>,
      path: (string | number)[],
      label: string,
    ) {
      const unknown = references.filter(
        (reference) => !knownIds.has(reference),
      );
      if (unknown.length > 0) {
        context.addIssue({
          code: "custom",
          path,
          message: `Unknown ${label}: ${unknown.join(", ")}.`,
        });
      }
    }

    value.dependencyNodes.forEach((node, nodeIndex) => {
      const path = ["dependencyNodes", nodeIndex, "dependsOn"];
      requireUniqueReferences(node.dependsOn, path);
      requireKnownReferences(
        node.dependsOn,
        observerOrNodeIds,
        path,
        "observer or dependency-node reference",
      );
    });

    const dependencyNodeById = new Map(
      value.dependencyNodes.map((node) => [node.id, node]),
    );
    const visitingDependencyNodes = new Set<string>();
    const visitedDependencyNodes = new Set<string>();

    function hasDependencyNodeCycle(nodeId: string): boolean {
      if (visitingDependencyNodes.has(nodeId)) return true;
      if (visitedDependencyNodes.has(nodeId)) return false;

      visitingDependencyNodes.add(nodeId);
      const node = dependencyNodeById.get(nodeId);
      const cyclic =
        node?.dependsOn.some(
          (dependencyId) =>
            dependencyNodeById.has(dependencyId) &&
            hasDependencyNodeCycle(dependencyId),
        ) ?? false;
      visitingDependencyNodes.delete(nodeId);
      visitedDependencyNodes.add(nodeId);
      return cyclic;
    }

    if (value.dependencyNodes.some((node) => hasDependencyNodeCycle(node.id))) {
      context.addIssue({
        code: "custom",
        path: ["dependencyNodes"],
        message:
          "Dependency-node graphs must be acyclic; circular evidence cannot warrant itself.",
      });
    }

    value.actions.forEach((action, actionIndex) => {
      const referenceSets = [
        ["boundaryIds", action.boundaryIds, boundaryIds, "boundary reference"],
        [
          "dependsOnActions",
          action.dependsOnActions,
          actionIds,
          "action dependency",
        ],
        [
          "dependencyNodeIds",
          action.dependencyNodeIds,
          dependencyNodeIds,
          "dependency-node reference",
        ],
        [
          "reductionIds",
          action.reductionIds,
          reductionIds,
          "reduction reference",
        ],
        [
          "principalIds",
          action.principalIds,
          principalIds,
          "principal reference",
        ],
      ] as const;

      for (const [field, references, knownIds, label] of referenceSets) {
        const path = ["actions", actionIndex, field];
        requireUniqueReferences(references, path);
        requireKnownReferences(references, knownIds, path, label);
      }

      const touchesRelationshipBoundary = action.boundaryIds.some(
        (boundaryId) =>
          value.boundaries.find((boundary) => boundary.id === boundaryId)
            ?.domain === "relationship",
      );
      if (
        touchesRelationshipBoundary &&
        (action.principalIds.length !== principalIds.size ||
          action.principalIds.some(
            (principalId) => !principalIds.has(principalId),
          ))
      ) {
        context.addIssue({
          code: "custom",
          path: ["actions", actionIndex, "principalIds"],
          message:
            "Relationship effects must name both protocol principals so autonomy checks cannot be bypassed.",
        });
      }
    });

    const careHorizons = value.careFlow.map((sample) => sample.horizon);
    if (new Set(careHorizons).size !== careHorizons.length) {
      context.addIssue({
        code: "custom",
        path: ["careFlow"],
        message: "Care flow requires one sample for each distinct horizon.",
      });
    }

    if (value.principals[0]?.id === value.principals[1]?.id) {
      context.addIssue({
        code: "custom",
        path: ["principals"],
        message: "Care flow requires two distinct principals.",
      });
    }

    const sourceSystems = value.reductions.map((item) => item.sourceSystem);
    if (new Set(sourceSystems).size !== sourceSystems.length) {
      context.addIssue({
        code: "custom",
        path: ["reductions"],
        message:
          "Each 144-source system needs its own reduction certificate; sources cannot be merged.",
      });
    }
  });

export type FlowDomain = z.infer<typeof flowDomainSchema>;
export type ReductionSource = z.infer<typeof reductionSourceSchema>;
export type FlowObserver = z.infer<typeof flowObserverSchema>;
export type DependencyNode = z.infer<typeof dependencyNodeSchema>;
export type ProtectedBoundary = z.infer<typeof protectedBoundarySchema>;
export type IdentityPromotion = z.infer<typeof identityPromotionSchema>;
export type WitnessReduction = z.infer<typeof witnessReductionSchema>;
export type FlowPrincipal = z.infer<typeof flowPrincipalSchema>;
export type CareSample = z.infer<typeof careSampleSchema>;
export type MemoryEvent = z.infer<typeof memoryEventSchema>;
export type FlowAction = z.infer<typeof flowActionSchema>;
export type FlowBlockCode = z.infer<typeof flowBlockCodeSchema>;
export type ProbabilityFlowReceipt = z.infer<
  typeof probabilityFlowReceiptSchema
>;
export type ProbabilityFlowProtocol = z.infer<
  typeof probabilityFlowProtocolSchema
>;
