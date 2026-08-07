import {
  NOESIS_SCHEMA_VERSION,
  parseNoesisWorkspace,
  type AuditEvent,
  type EvidenceItem,
  type NoesisReceipt,
  type NoesisWorkspace,
  type WarrantLevel,
} from "./noesis-schema";
import {
  applyProbabilityFlowResolution,
  createInitialProbabilityFlowProtocol,
  verifyProbabilityFlowReplay,
} from "./probability-flow";

export type WarrantDecision = "allowed" | "verify" | "blocked";

export type WarrantBlocker = {
  code:
    | "approval_missing"
    | "workspace_title_missing"
    | "evidence_failed"
    | "evidence_missing"
    | "independent_verification_missing"
    | "canonical_state_missing"
    | "lease_expired"
    | "lease_budget_missing"
    | "lease_inactive"
    | "lease_scope_missing"
    | "lease_tools_missing"
    | "objective_missing"
    | "proof_coverage_low"
    | "probability_flow_hold"
    | "probability_flow_stale"
    | "probability_flow_unresolved"
    | "uncertainty_high"
    | "workspace_invalid";
  message: string;
  hard: boolean;
};

export type WarrantEvaluation = {
  decision: WarrantDecision;
  coverage: number;
  blockers: WarrantBlocker[];
  independentVerification: boolean;
  verifiedCount: number;
  evidenceCount: number;
};

export type WarrantPolicy = {
  label: string;
  minimumCoverage: number;
  maximumUncertainty: number;
  requiresIndependentVerification: boolean;
  requiresHumanApproval: boolean;
};

export const NOESIS_STORAGE_KEY = "founderlab.noesis.workspace.v1";

export const warrantPolicies: Record<WarrantLevel, WarrantPolicy> = {
  low: {
    label: "Low / reversible",
    minimumCoverage: 0.6,
    maximumUncertainty: 0.4,
    requiresIndependentVerification: false,
    requiresHumanApproval: false,
  },
  medium: {
    label: "Medium / controlled",
    minimumCoverage: 0.8,
    maximumUncertainty: 0.25,
    requiresIndependentVerification: true,
    requiresHumanApproval: false,
  },
  high: {
    label: "High / consequential",
    minimumCoverage: 0.9,
    maximumUncertainty: 0.15,
    requiresIndependentVerification: true,
    requiresHumanApproval: true,
  },
  critical: {
    label: "Critical / protected",
    minimumCoverage: 1,
    maximumUncertainty: 0.1,
    requiresIndependentVerification: true,
    requiresHumanApproval: true,
  },
};

const defaultTimestamp = "2026-07-13T00:00:00.000Z";
const initialProbabilityFlow = applyProbabilityFlowResolution(
  createInitialProbabilityFlowProtocol(defaultTimestamp),
  defaultTimestamp,
);

export const initialNoesisWorkspace: NoesisWorkspace = {
  schemaVersion: NOESIS_SCHEMA_VERSION,
  workspaceId: "workspace-public-preview",
  title: "Public preview readiness",
  objective:
    "Prepare a reversible public preview after tests and independent verification pass.",
  canonicalState:
    "The feature branch is local, production is gated, and no external execution has been authorized.",
  uncertainty: 0.31,
  warrantLevel: "medium",
  blocker: "Preview behavior has not been independently verified.",
  recursionOpen: false,
  recursionDepth: 0,
  evidence: [
    {
      id: "evidence-repo-state",
      claim: "Repository state is canonical",
      source: "git status and branch baseline",
      status: "verified",
      weight: 30,
      independent: false,
      observedAt: defaultTimestamp,
    },
    {
      id: "evidence-policy-gate",
      claim: "Production remains approval-gated",
      source: "repository release policy",
      status: "verified",
      weight: 25,
      independent: true,
      observedAt: defaultTimestamp,
    },
    {
      id: "evidence-preview-proof",
      claim: "Preview matches the intended behavior",
      source: "independent browser verifier",
      status: "pending",
      weight: 20,
      independent: true,
      observedAt: defaultTimestamp,
    },
  ],
  lease: {
    scope: "Local preview verification",
    tools: ["read workspace", "run checks", "open localhost"],
    active: true,
    budget: "One blocker and two verifier passes",
    expiresAt: null,
    approvalRequired: false,
    approvalGranted: false,
  },
  probabilityFlow: initialProbabilityFlow,
  audit: [
    {
      id: "audit-workspace-created",
      at: defaultTimestamp,
      kind: "workspace_created",
      message: "Default public workspace created.",
    },
  ],
  receipts: [],
  updatedAt: defaultTimestamp,
};

export function createNoesisId(prefix: string): string {
  const randomPart = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().slice(0, 12)
    : Math.random().toString(36).slice(2, 14);

  return `${prefix}-${randomPart}`;
}

export function createInitialNoesisWorkspace(
  now = new Date().toISOString(),
): NoesisWorkspace {
  return {
    ...initialNoesisWorkspace,
    workspaceId: createNoesisId("workspace"),
    evidence: initialNoesisWorkspace.evidence.map((item) => ({
      ...item,
      id: createNoesisId("evidence"),
      observedAt: now,
    })),
    lease: { ...initialNoesisWorkspace.lease },
    probabilityFlow: applyProbabilityFlowResolution(
      createInitialProbabilityFlowProtocol(now),
      now,
    ),
    audit: [
      {
        id: createNoesisId("audit"),
        at: now,
        kind: "workspace_created",
        message: "New local workspace created.",
      },
    ],
    receipts: [],
    updatedAt: now,
  };
}

export function appendAudit(
  workspace: NoesisWorkspace,
  event: Omit<AuditEvent, "id" | "at">,
  now = new Date().toISOString(),
): NoesisWorkspace {
  return {
    ...workspace,
    audit: [
      {
        ...event,
        id: createNoesisId("audit"),
        at: now,
      },
      ...workspace.audit,
    ].slice(0, 200),
    updatedAt: now,
  };
}

export function createEvidenceItem(
  now = new Date().toISOString(),
): EvidenceItem {
  return {
    id: createNoesisId("evidence"),
    claim: "New proof claim",
    source: "Describe the source or verifier",
    status: "pending",
    weight: 10,
    independent: false,
    observedAt: now,
  };
}

export function evaluateWarrant(
  workspace: NoesisWorkspace,
  now = new Date().toISOString(),
): WarrantEvaluation {
  const workspaceValidation = parseNoesisWorkspace(workspace);
  const policy = warrantPolicies[workspace.warrantLevel];
  const totalWeight = workspace.evidence.reduce(
    (total, item) => total + item.weight,
    0,
  );
  const verifiedEvidence = workspace.evidence.filter(
    (item) => item.status === "verified",
  );
  const verifiedWeight = verifiedEvidence.reduce(
    (total, item) => total + item.weight,
    0,
  );
  const coverage = totalWeight === 0 ? 0 : verifiedWeight / totalWeight;
  const independentVerification = verifiedEvidence.some(
    (item) => item.independent,
  );
  const failedEvidence = workspace.evidence.some(
    (item) => item.status === "failed",
  );
  const leaseExpired = Boolean(
    workspace.lease.expiresAt &&
    Date.parse(workspace.lease.expiresAt) <= Date.parse(now),
  );
  const blockers: WarrantBlocker[] = [];
  const latestProbabilityFlowReceipt = workspace.probabilityFlow.receipts[0];

  if (workspace.title.trim().length < 3) {
    blockers.push({
      code: "workspace_title_missing",
      message: "Name this workspace before evaluation.",
      hard: true,
    });
  }

  if (workspace.objective.trim().length < 3) {
    blockers.push({
      code: "objective_missing",
      message: "Define a testable objective before evaluation.",
      hard: true,
    });
  }

  if (workspace.canonicalState.trim().length < 3) {
    blockers.push({
      code: "canonical_state_missing",
      message: "Canonical current state is required.",
      hard: true,
    });
  }

  if (workspace.lease.scope.trim().length < 3) {
    blockers.push({
      code: "lease_scope_missing",
      message: "Capability lease scope is required.",
      hard: true,
    });
  }

  if (workspace.lease.tools.length === 0) {
    blockers.push({
      code: "lease_tools_missing",
      message: "Name at least one permitted tool.",
      hard: true,
    });
  }

  if (workspace.lease.budget.trim().length < 3) {
    blockers.push({
      code: "lease_budget_missing",
      message: "Define a bounded lease budget.",
      hard: true,
    });
  }

  if (!workspace.lease.active) {
    blockers.push({
      code: "lease_inactive",
      message: "Capability lease is inactive.",
      hard: true,
    });
  }

  if (leaseExpired) {
    blockers.push({
      code: "lease_expired",
      message: "Capability lease has expired.",
      hard: true,
    });
  }

  if (
    policy.requiresHumanApproval &&
    (!workspace.lease.approvalRequired || !workspace.lease.approvalGranted)
  ) {
    blockers.push({
      code: "approval_missing",
      message: "Human approval is required for this warrant level.",
      hard: true,
    });
  }

  if (failedEvidence) {
    blockers.push({
      code: "evidence_failed",
      message: "At least one proof item failed verification.",
      hard: true,
    });
  }

  if (workspace.evidence.length === 0) {
    blockers.push({
      code: "evidence_missing",
      message: "At least one proof item is required.",
      hard: false,
    });
  }

  if (coverage < policy.minimumCoverage) {
    blockers.push({
      code: "proof_coverage_low",
      message: `Proof coverage must reach ${formatPercent(policy.minimumCoverage)}.`,
      hard: false,
    });
  }

  if (policy.requiresIndependentVerification && !independentVerification) {
    blockers.push({
      code: "independent_verification_missing",
      message: "Independent verified evidence is required.",
      hard: false,
    });
  }

  if (workspace.uncertainty > policy.maximumUncertainty) {
    blockers.push({
      code: "uncertainty_high",
      message: `Uncertainty must be ${formatPercent(policy.maximumUncertainty)} or lower.`,
      hard: false,
    });
  }

  if (workspace.probabilityFlow.enabled && !latestProbabilityFlowReceipt) {
    blockers.push({
      code: "probability_flow_unresolved",
      message: "Resolve the enabled probability-flow envelope before acting.",
      hard: false,
    });
  }

  if (workspace.probabilityFlow.enabled && latestProbabilityFlowReceipt) {
    const replay = verifyProbabilityFlowReplay(
      workspace.probabilityFlow,
      latestProbabilityFlowReceipt,
    );

    if (!replay.ok) {
      blockers.push({
        code: "probability_flow_stale",
        message:
          "The probability-flow inputs changed after resolution; replay and re-authorize them.",
        hard: true,
      });
    } else if (latestProbabilityFlowReceipt.decision === "hold") {
      blockers.push({
        code: "probability_flow_hold",
        message:
          "Probability flow authorizes no bounded effect under the current constraints.",
        hard: true,
      });
    }
  }

  if (!workspaceValidation.success) {
    blockers.push({
      code: "workspace_invalid",
      message: "Complete every required workspace field before evaluation.",
      hard: true,
    });
  }

  const decision: WarrantDecision = blockers.some((blocker) => blocker.hard)
    ? "blocked"
    : blockers.length > 0
      ? "verify"
      : "allowed";

  return {
    decision,
    coverage,
    blockers,
    independentVerification,
    verifiedCount: verifiedEvidence.length,
    evidenceCount: workspace.evidence.length,
  };
}

export function issueDryRunReceipt(
  workspace: NoesisWorkspace,
  options: { now?: string; receiptId?: string; residualRisk?: string } = {},
): NoesisWorkspace {
  const now = options.now ?? new Date().toISOString();
  const evaluation = evaluateWarrant(workspace, now);

  if (evaluation.decision !== "allowed") {
    throw new Error("A receipt requires an allowed warrant decision.");
  }

  const receipt: NoesisReceipt = {
    schemaVersion: NOESIS_SCHEMA_VERSION,
    receiptId: options.receiptId ?? createNoesisId("receipt"),
    workspaceId: workspace.workspaceId,
    issuedAt: now,
    decision: "allowed",
    result: "dry_run_completed",
    warrantLevel: workspace.warrantLevel,
    objective: workspace.objective,
    canonicalState: workspace.canonicalState,
    canonicalStateRevision: workspace.updatedAt,
    coverage: evaluation.coverage,
    uncertainty: workspace.uncertainty,
    verifiedEvidenceIds: workspace.evidence
      .filter((item) => item.status === "verified")
      .map((item) => item.id),
    independentVerification: evaluation.independentVerification,
    lease: { ...workspace.lease, tools: [...workspace.lease.tools] },
    probabilityFlowReceipt: workspace.probabilityFlow.enabled
      ? workspace.probabilityFlow.receipts[0]
      : undefined,
    residualRisk:
      options.residualRisk ??
      "External execution remains disabled; this receipt records a local dry run only.",
  };

  return appendAudit(
    {
      ...workspace,
      lease: { ...workspace.lease, active: false },
      receipts: [receipt, ...workspace.receipts].slice(0, 25),
    },
    {
      kind: "receipt_issued",
      message: `${receipt.receiptId} issued; the bounded lease was revoked.`,
    },
    now,
  );
}

export function serializeWorkspace(workspace: NoesisWorkspace): string {
  return `${JSON.stringify(workspace, null, 2)}\n`;
}

export function deserializeWorkspace(
  serialized: string,
):
  | { success: true; data: NoesisWorkspace }
  | { success: false; error: string } {
  try {
    return parseNoesisWorkspace(JSON.parse(serialized) as unknown);
  } catch {
    return { success: false, error: "Workspace file is not valid JSON." };
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
