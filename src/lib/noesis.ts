export type EvidenceStatus = "verified" | "pending" | "failed";

export type EvidenceItem = {
  id: string;
  label: string;
  source: string;
  status: EvidenceStatus;
  weight: number;
  independent: boolean;
};

export type CapabilityLease = {
  scope: string;
  tools: string[];
  active: boolean;
  budget: string;
};

export type NoesisSnapshot = {
  objective: string;
  canonicalState: string;
  uncertainty: number;
  recursionOpen: boolean;
  recursionDepth: number;
  blocker: string;
  evidence: EvidenceItem[];
  lease: CapabilityLease;
};

export type WarrantDecision = "allowed" | "verify" | "blocked";

export type WarrantEvaluation = {
  decision: WarrantDecision;
  coverage: number;
  blockers: string[];
  independentVerification: boolean;
};

export const initialNoesisSnapshot: NoesisSnapshot = {
  objective:
    "Prepare a reversible public preview after tests and independent verification pass.",
  canonicalState:
    "Branch is local, production is gated, and no external action has been authorized.",
  uncertainty: 0.31,
  recursionOpen: false,
  recursionDepth: 0,
  blocker: "Preview behavior has not been independently verified.",
  evidence: [
    {
      id: "repo-state",
      label: "Repository state is canonical",
      source: "git status + branch baseline",
      status: "verified",
      weight: 30,
      independent: false,
    },
    {
      id: "policy-gate",
      label: "Production remains approval-gated",
      source: "release policy",
      status: "verified",
      weight: 25,
      independent: true,
    },
    {
      id: "preview-proof",
      label: "Preview matches the intended behavior",
      source: "independent browser verifier",
      status: "pending",
      weight: 20,
      independent: true,
    },
  ],
  lease: {
    scope: "local preview verification",
    tools: ["read workspace", "run checks", "open localhost"],
    active: true,
    budget: "1 blocker / 2 verifier passes",
  },
};

export function evaluateWarrant(snapshot: NoesisSnapshot): WarrantEvaluation {
  const totalWeight = snapshot.evidence.reduce(
    (total, item) => total + item.weight,
    0,
  );
  const verifiedWeight = snapshot.evidence
    .filter((item) => item.status === "verified")
    .reduce((total, item) => total + item.weight, 0);
  const coverage = totalWeight === 0 ? 0 : verifiedWeight / totalWeight;
  const hasFailedEvidence = snapshot.evidence.some(
    (item) => item.status === "failed",
  );
  const independentVerification = snapshot.evidence.some(
    (item) => item.independent && item.status === "verified",
  );
  const blockers: string[] = [];

  if (!snapshot.lease.active) blockers.push("Capability lease is inactive.");
  if (hasFailedEvidence) blockers.push("A required proof failed verification.");
  if (coverage < 0.8) blockers.push("Proof coverage is below 80%.");
  if (!independentVerification)
    blockers.push("Independent verification is missing.");
  if (snapshot.uncertainty > 0.25)
    blockers.push("Calibrated uncertainty is above 25%.");

  if (
    snapshot.lease.active &&
    !hasFailedEvidence &&
    coverage >= 0.8 &&
    independentVerification &&
    snapshot.uncertainty <= 0.25
  ) {
    return {
      decision: "allowed",
      coverage,
      blockers: [],
      independentVerification,
    };
  }

  const decision: WarrantDecision =
    snapshot.lease.active && !hasFailedEvidence && coverage >= 0.5
      ? "verify"
      : "blocked";

  return { decision, coverage, blockers, independentVerification };
}

export function openBlockingRecursion(
  snapshot: NoesisSnapshot,
): NoesisSnapshot {
  return {
    ...snapshot,
    recursionOpen: true,
    recursionDepth: 1,
    canonicalState:
      "Only the preview-verification subproblem is open; the parent objective is frozen.",
    uncertainty: Math.min(snapshot.uncertainty, 0.25),
  };
}

export function verifyBlockingEvidence(
  snapshot: NoesisSnapshot,
): NoesisSnapshot {
  return {
    ...snapshot,
    recursionOpen: true,
    recursionDepth: 1,
    uncertainty: 0.17,
    canonicalState:
      "The preview verifier passed; production remains gated and external execution is still prohibited.",
    evidence: snapshot.evidence.map((item) =>
      item.id === "preview-proof"
        ? { ...item, status: "verified" as const }
        : item,
    ),
  };
}
