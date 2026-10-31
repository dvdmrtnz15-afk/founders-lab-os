import { describe, expect, it } from "vitest";
import {
  authorityFingerprint,
  bindApproval,
  evaluateWarrant,
  initialNoesisWorkspace,
  issueDryRunReceipt,
  reconcileApproval,
  requiresHumanApproval,
} from "./noesis";
import { parseNoesisWorkspace, type NoesisWorkspace } from "./noesis-schema";
import { personaFingerprint } from "./persona/persona";
import { getPersona, TOOLS } from "./persona/registry";

const now = "2026-07-13T12:00:00.000Z";
const reviewer = getPersona("role:reviewer")!;
const governor = getPersona("role:noesis-governor")!;
const data = getPersona("role:data")!;

function allowedWorkspace(): NoesisWorkspace {
  const initial = structuredClone(initialNoesisWorkspace);
  return {
    ...initial,
    uncertainty: 0.12,
    evidence: initial.evidence.map((item) => ({
      ...item,
      status: "verified" as const,
    })),
    lease: { ...initial.lease, active: true },
  };
}

function codes(workspace: NoesisWorkspace) {
  return evaluateWarrant(workspace, now).blockers.map((b) => b.code);
}

describe("persona backward compatibility", () => {
  it("leaves the fingerprint of a persona-free workspace unchanged", () => {
    // Pinned from the pre-persona kernel (commit 4c72846): existing bound
    // approvals and exported receipts must keep verifying.
    expect(authorityFingerprint(initialNoesisWorkspace)).toBe(
      "fnv1a64:1aa796c40d42b698",
    );
    const withEmpty = { ...allowedWorkspace(), persona: undefined };
    expect(authorityFingerprint(withEmpty)).toBe(
      authorityFingerprint(allowedWorkspace()),
    );
  });

  it("round-trips a workspace with persona and council through the schema", () => {
    const workspace = {
      ...allowedWorkspace(),
      persona: governor,
      council: [
        {
          personaRef: "role:security",
          verdict: "pass" as const,
          score: 0.8,
          reason: "No auth surface touched.",
          hardVeto: true,
        },
      ],
    };
    expect(parseNoesisWorkspace(workspace).success).toBe(true);
  });
});

describe("evaluateWarrant with a persona", () => {
  it("allows when the persona's ceiling and tools cover the lease", () => {
    const result = evaluateWarrant(
      { ...allowedWorkspace(), persona: governor },
      now,
    );
    expect(result.decision).toBe("allowed");
  });

  it("blocks a persona acting above its ceiling with tools it lacks", () => {
    expect(codes({ ...allowedWorkspace(), persona: reviewer })).toEqual([
      "persona_ceiling_exceeded",
      "persona_tool_blocked",
    ]);
  });

  it("blocks an invalid persona and flags the workspace invalid", () => {
    const workspace = {
      ...allowedWorkspace(),
      persona: { ...governor, displayName: "Sentient Governor" },
    };
    expect(codes(workspace)).toEqual(["persona_invalid", "workspace_invalid"]);
  });

  it("requires a bound approval when the persona escalates below the policy tier", () => {
    const workspace: NoesisWorkspace = {
      ...allowedWorkspace(),
      persona: data,
      lease: {
        ...allowedWorkspace().lease,
        tools: [TOOLS.readWorkspace, TOOLS.runChecks],
      },
    };
    expect(requiresHumanApproval(workspace)).toBe(true);
    expect(codes(workspace)).toEqual(["persona_escalation_required"]);

    const approved = bindApproval({
      ...workspace,
      lease: {
        ...workspace.lease,
        approvalRequired: true,
        approvalGranted: true,
      },
    });
    expect(evaluateWarrant(approved, now).decision).toBe("allowed");
  });

  it("voids a bound approval when the persona changes", () => {
    const workspace: NoesisWorkspace = bindApproval({
      ...allowedWorkspace(),
      persona: data,
      lease: {
        ...allowedWorkspace().lease,
        tools: [TOOLS.readWorkspace],
        approvalRequired: true,
        approvalGranted: true,
      },
    });
    const edited = { ...workspace, persona: { ...data, version: 2 } };

    expect(codes(edited)).toEqual(["persona_escalation_required"]);
    expect(reconcileApproval(edited, now).lease.approvalGranted).toBe(false);
  });
});

describe("evaluateWarrant with a council", () => {
  const vote = {
    personaRef: "role:security",
    verdict: "pass" as const,
    score: 0.9,
    reason: "Reviewed the diff.",
    hardVeto: true,
  };

  it("adds no proof: a passing council cannot lift a held workspace", () => {
    const held = { ...initialNoesisWorkspace, council: [vote] };
    const result = evaluateWarrant(held, now);
    expect(result.decision).toBe("verify");
    expect(result.coverage).toBe(
      evaluateWarrant(initialNoesisWorkspace, now).coverage,
    );
  });

  it("hard-blocks on a veto and holds on a warning", () => {
    expect(
      codes({
        ...allowedWorkspace(),
        council: [{ ...vote, verdict: "block" }],
      }),
    ).toEqual(["council_veto"]);
    const warned = evaluateWarrant(
      { ...allowedWorkspace(), council: [{ ...vote, verdict: "warn" }] },
      now,
    );
    expect(warned.decision).toBe("verify");
    expect(warned.blockers.map((b) => b.code)).toEqual(["council_hold"]);
  });

  it("rejects a council where the acting persona reviews itself", () => {
    const workspace = {
      ...allowedWorkspace(),
      persona: governor,
      council: [{ ...vote, personaRef: governor.ref }],
    };
    expect(codes(workspace)).toEqual(["council_invalid"]);
  });
});

describe("receipts", () => {
  it("bind the acting persona's ref and fingerprint", () => {
    const issued = issueDryRunReceipt(
      { ...allowedWorkspace(), persona: governor },
      { now, receiptId: "receipt-persona" },
    );
    expect(issued.receipts[0].personaRef).toBe(governor.ref);
    expect(issued.receipts[0].personaFingerprint).toBe(
      personaFingerprint(governor),
    );
  });

  it("omit persona fields when no persona acted", () => {
    const issued = issueDryRunReceipt(allowedWorkspace(), {
      now,
      receiptId: "receipt-plain",
    });
    expect(issued.receipts[0]).not.toHaveProperty("personaRef");
  });
});
