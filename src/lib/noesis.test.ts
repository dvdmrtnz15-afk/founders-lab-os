import { describe, expect, it } from "vitest";
import {
  deserializeWorkspace,
  evaluateWarrant,
  initialNoesisWorkspace,
  issueDryRunReceipt,
  serializeWorkspace,
  warrantPolicies,
} from "./noesis";

const now = "2026-07-13T12:00:00.000Z";

function allowedWorkspace() {
  return {
    ...initialNoesisWorkspace,
    uncertainty: 0.12,
    evidence: initialNoesisWorkspace.evidence.map((item) => ({
      ...item,
      status: "verified" as const,
    })),
    lease: { ...initialNoesisWorkspace.lease, active: true },
  };
}

describe("evaluateWarrant", () => {
  it("holds the default medium-risk workspace for more proof", () => {
    const result = evaluateWarrant(initialNoesisWorkspace, now);

    expect(result.decision).toBe("verify");
    expect(result.coverage).toBeCloseTo(55 / 75);
    expect(result.blockers.map((blocker) => blocker.code)).toEqual([
      "proof_coverage_low",
      "uncertainty_high",
    ]);
  });

  it("allows a fully verified medium-risk workspace", () => {
    const result = evaluateWarrant(allowedWorkspace(), now);

    expect(result.decision).toBe("allowed");
    expect(result.coverage).toBe(1);
    expect(result.independentVerification).toBe(true);
  });

  it("blocks an inactive lease even when proof passes", () => {
    const workspace = allowedWorkspace();
    workspace.lease.active = false;

    const result = evaluateWarrant(workspace, now);

    expect(result.decision).toBe("blocked");
    expect(result.blockers[0]?.code).toBe("lease_inactive");
  });

  it("blocks an incomplete objective draft", () => {
    const workspace = { ...allowedWorkspace(), objective: "" };

    const result = evaluateWarrant(workspace, now);

    expect(result.decision).toBe("blocked");
    expect(result.blockers[0]?.code).toBe("objective_missing");
  });

  it("blocks a lease without a bounded budget", () => {
    const workspace = allowedWorkspace();
    workspace.lease.budget = "";

    const result = evaluateWarrant(workspace, now);

    expect(result.decision).toBe("blocked");
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "lease_budget_missing",
    );
  });

  it("compares lease expiry instants across timezone offsets", () => {
    const workspace = allowedWorkspace();
    workspace.lease.expiresAt = "2026-07-13T08:00:00-05:00";

    const result = evaluateWarrant(workspace, now);

    expect(result.blockers.map((blocker) => blocker.code)).not.toContain(
      "lease_expired",
    );
  });

  it("blocks verified evidence with an invalid claim", () => {
    const workspace = allowedWorkspace();
    workspace.evidence[0].claim = "";

    const result = evaluateWarrant(workspace, now);

    expect(result.decision).toBe("blocked");
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "workspace_invalid",
    );
  });

  it("requires explicit human approval at high risk", () => {
    const workspace = {
      ...allowedWorkspace(),
      uncertainty: warrantPolicies.high.maximumUncertainty,
      warrantLevel: "high" as const,
      lease: {
        ...allowedWorkspace().lease,
        approvalRequired: true,
        approvalGranted: false,
      },
    };

    const result = evaluateWarrant(workspace, now);

    expect(result.decision).toBe("blocked");
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "approval_missing",
    );
  });
});

describe("workspace contracts", () => {
  it("round-trips a valid workspace", () => {
    const result = deserializeWorkspace(
      serializeWorkspace(initialNoesisWorkspace),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workspaceId).toBe(initialNoesisWorkspace.workspaceId);
    }
  });

  it("rejects malformed or unknown workspace fields", () => {
    const invalid = JSON.stringify({
      ...initialNoesisWorkspace,
      uncertainty: 8,
      unsafeOverride: true,
    });
    const result = deserializeWorkspace(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("uncertainty");
    }
  });

  it("issues a dry-run receipt and revokes the lease", () => {
    const workspace = issueDryRunReceipt(allowedWorkspace(), {
      now,
      receiptId: "receipt-test-001",
    });

    expect(workspace.receipts[0]?.receiptId).toBe("receipt-test-001");
    expect(workspace.receipts[0]?.verifiedEvidenceIds).toHaveLength(3);
    expect(workspace.lease.active).toBe(false);
    expect(workspace.audit[0]?.kind).toBe("receipt_issued");
  });

  it("refuses to issue a receipt without an allowed warrant", () => {
    expect(() => issueDryRunReceipt(initialNoesisWorkspace, { now })).toThrow(
      "allowed warrant decision",
    );
  });
});
