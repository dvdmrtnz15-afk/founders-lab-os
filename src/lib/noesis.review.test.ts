import { describe, expect, it } from "vitest";
import type { NoesisWorkspace, WarrantLevel } from "./noesis-schema";
import {
  authorityFingerprint,
  bindApproval,
  deserializeWorkspace,
  initialNoesisWorkspace,
  evaluateWarrant,
  issueDryRunReceipt,
  reconcileApproval,
  serializeWorkspace,
  stripImportedAuthority,
  warrantPolicies,
} from "./noesis";

const now = "2026-10-22T12:00:00.000Z";

function approvedWorkspace(level: WarrantLevel): NoesisWorkspace {
  return bindApproval({
    ...structuredClone(initialNoesisWorkspace),
    warrantLevel: level,
    uncertainty: 0.05,
    evidence: initialNoesisWorkspace.evidence.map((item) => ({
      ...item,
      status: "verified",
    })),
    lease: {
      ...initialNoesisWorkspace.lease,
      approvalRequired: true,
      approvalGranted: true,
    },
  });
}

describe("independent authorization regression checks", () => {
  it.each(["high", "critical"] as const)(
    "refuses receipts after protected %s content changes and audits reconciliation",
    (level) => {
      const approved = approvedWorkspace(level);
      const edits: Record<string, (w: NoesisWorkspace) => void> = {
        identity: (w) => {
          w.workspaceId = "workspace-other";
        },
        tier: (w) => {
          w.warrantLevel = level === "high" ? "critical" : "high";
        },
        uncertainty: (w) => {
          w.uncertainty = 0.06;
        },
        evidenceId: (w) => {
          w.evidence[0].id = "evidence-other";
        },
        evidenceClaim: (w) => {
          w.evidence[0].claim = "A changed verified claim";
        },
        evidenceStatus: (w) => {
          w.evidence[0].status = "pending";
        },
        evidenceWeight: (w) => {
          w.evidence[0].weight += 1;
        },
        evidenceIndependence: (w) => {
          w.evidence[0].independent = true;
        },
        evidenceAdded: (w) => {
          w.evidence.push({ ...w.evidence[0], id: "evidence-added" });
        },
        evidenceRemoved: (w) => {
          w.evidence.pop();
        },
        scope: (w) => {
          w.lease.scope = "A different scope";
        },
        budget: (w) => {
          w.lease.budget = "Two additional passes";
        },
        expiry: (w) => {
          w.lease.expiresAt = "2026-10-23T12:00:00.000Z";
        },
      };

      for (const [field, edit] of Object.entries(edits)) {
        const changed = structuredClone(approved);
        edit(changed);
        expect(
          evaluateWarrant(changed, now).blockers.map((b) => b.code),
          field,
        ).toContain("approval_stale");
        expect(() => issueDryRunReceipt(changed, { now }), field).toThrow();
        const reconciled = reconcileApproval(changed, now);
        expect(reconciled.lease.approvalGranted, field).toBe(false);
        expect(reconciled.lease.approvalFingerprint, field).toBeNull();
        expect(reconciled.audit[0].message, field).toContain(
          "approval revoked",
        );
      }
    },
  );

  it.each(["low", "medium", "critical"] as const)(
    "audits revocation when an approved high workspace changes to %s",
    (level) => {
      const approved = approvedWorkspace("high");
      const reconciled = reconcileApproval(
        {
          ...approved,
          warrantLevel: level,
          lease: {
            ...approved.lease,
            approvalRequired: warrantPolicies[level].requiresHumanApproval,
          },
        },
        now,
      );
      expect(reconciled.lease.approvalGranted).toBe(false);
      expect(reconciled.lease.approvalFingerprint).toBeNull();
      expect(reconciled.audit).toHaveLength(approved.audit.length + 1);
      expect(reconciled.audit[0].kind).toBe("lease_changed");
    },
  );

  it.each(["high", "critical"] as const)(
    "does not restore imported %s authority by reactivating its lease",
    (level) => {
      const parsed = deserializeWorkspace(
        serializeWorkspace(approvedWorkspace(level)),
      );
      if (!parsed.success) throw new Error(parsed.error);
      const imported = stripImportedAuthority(parsed.data);
      expect(() => issueDryRunReceipt(imported, { now })).toThrow();
      const reactivated = {
        ...imported,
        lease: { ...imported.lease, active: true },
      };
      expect(
        evaluateWarrant(reactivated, now).blockers.map((b) => b.code),
      ).toContain("approval_missing");
      expect(() => issueDryRunReceipt(reactivated, { now })).toThrow();
      const reapproved = bindApproval({
        ...reactivated,
        lease: { ...reactivated.lease, approvalGranted: true },
      });
      expect(evaluateWarrant(reapproved, now).decision).toBe("allowed");
    },
  );

  it("loads legacy receipts but revokes legacy current approval", () => {
    const issued = issueDryRunReceipt(approvedWorkspace("high"), { now });
    delete issued.receipts[0].authorityFingerprint;
    delete issued.receipts[0].lease.approvalFingerprint;
    delete issued.lease.approvalFingerprint;
    issued.lease.active = true;
    const parsed = deserializeWorkspace(serializeWorkspace(issued));
    if (!parsed.success) throw new Error(parsed.error);
    expect(() => issueDryRunReceipt(parsed.data, { now })).toThrow();
    const reconciled = reconcileApproval(parsed.data, now);
    expect(reconciled.lease.approvalGranted).toBe(false);
    expect(reconciled.receipts).toHaveLength(1);
    expect(reconciled.audit[0].message).toContain("approval revoked");
  });

  it("requires lease reactivation for a repeat local dry-run receipt", () => {
    const approved = approvedWorkspace("high");
    const issued = issueDryRunReceipt(approved, { now });
    expect(issued.receipts[0].lease.active).toBe(true);
    expect(issued.lease.active).toBe(false);
    expect(() => issueDryRunReceipt(issued, { now })).toThrow();
    const repeated = issueDryRunReceipt(
      { ...issued, lease: { ...issued.lease, active: true } },
      { now },
    );
    expect(repeated.receipts).toHaveLength(2);
    expect(repeated.receipts[0].authorityFingerprint).toBe(
      authorityFingerprint(approved),
    );
    expect(repeated.receipts[0].result).toBe("dry_run_completed");
  });
});
