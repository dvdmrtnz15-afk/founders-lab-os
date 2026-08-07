"use client";

import { useEffect, useState } from "react";
import {
  NOESIS_STORAGE_KEY,
  appendAudit,
  createEvidenceItem,
  createInitialNoesisWorkspace,
  deserializeWorkspace,
  evaluateWarrant,
  initialNoesisWorkspace,
  issueDryRunReceipt,
  serializeWorkspace,
  warrantPolicies,
} from "@/lib/noesis";
import { applyProbabilityFlowResolution } from "@/lib/probability-flow";
import {
  parseNoesisWorkspace,
  type CapabilityLease,
  type EvidenceItem,
  type NoesisWorkspace,
} from "@/lib/noesis-schema";
import type { ProbabilityFlowProtocol } from "@/lib/probability-flow-schema";
import { AuditTimeline } from "./components/audit-timeline";
import { EvidenceLedger } from "./components/evidence-ledger";
import { ProbabilityFlowPanel } from "./components/probability-flow-panel";
import { WarrantPanel } from "./components/warrant-panel";
import { WorkbenchHeader } from "./components/workbench-header";
import { WorkspaceEditor } from "./components/workspace-editor";

type Notice = { tone: "success" | "error"; message: string } | null;

function downloadJson(payload: string, filename: string) {
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function NoesisWorkbench() {
  const [workspace, setWorkspace] = useState<NoesisWorkspace>(
    initialNoesisWorkspace,
  );
  const [hydrated, setHydrated] = useState(false);
  const [savedRevision, setSavedRevision] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const evaluation = evaluateWarrant(workspace);
  const workspaceValidation = parseNoesisWorkspace(workspace);
  const saveState = !hydrated
    ? "loading"
    : !workspaceValidation.success
      ? "draft"
      : savedRevision === workspace.updatedAt
        ? "saved"
        : "loading";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = window.localStorage.getItem(NOESIS_STORAGE_KEY);

      if (stored) {
        const result = deserializeWorkspace(stored);
        if (result.success) {
          setWorkspace(result.data);
          setSavedRevision(result.data.updatedAt);
        } else {
          setNotice({
            tone: "error",
            message: `Saved workspace could not be loaded: ${result.error}`,
          });
        }
      }

      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const validation = parseNoesisWorkspace(workspace);
    if (!validation.success) return;

    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(
        NOESIS_STORAGE_KEY,
        serializeWorkspace(validation.data),
      );
      setSavedRevision(validation.data.updatedAt);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [hydrated, workspace]);

  function updateWorkspace(patch: Partial<NoesisWorkspace>) {
    setWorkspace((current) => {
      const now = new Date().toISOString();
      const warrantLevel = patch.warrantLevel ?? current.warrantLevel;
      const policyChanged = patch.warrantLevel !== undefined;

      return {
        ...current,
        ...patch,
        lease: policyChanged
          ? {
              ...current.lease,
              approvalRequired:
                warrantPolicies[warrantLevel].requiresHumanApproval,
              approvalGranted: false,
            }
          : current.lease,
        updatedAt: now,
      };
    });
  }

  function updateLease(patch: Partial<CapabilityLease>) {
    setWorkspace((current) => {
      const now = new Date().toISOString();
      const updated = {
        ...current,
        lease: { ...current.lease, ...patch },
        updatedAt: now,
      };

      if (patch.active === undefined && patch.approvalGranted === undefined) {
        return updated;
      }

      return appendAudit(
        updated,
        {
          kind: "lease_changed",
          message: patch.active
            ? "Capability lease activated."
            : patch.approvalGranted
              ? "Required human approval recorded."
              : "Capability lease or approval was revoked.",
        },
        now,
      );
    });
  }

  function updateEvidence(id: string, patch: Partial<EvidenceItem>) {
    setWorkspace((current) => {
      const now = new Date().toISOString();
      return {
        ...current,
        evidence: current.evidence.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                observedAt: patch.status ? now : item.observedAt,
              }
            : item,
        ),
        updatedAt: now,
      };
    });
  }

  function addEvidence() {
    setWorkspace((current) => {
      const now = new Date().toISOString();
      const item = createEvidenceItem(now);
      return appendAudit(
        { ...current, evidence: [...current.evidence, item] },
        { kind: "evidence_added", message: `${item.id} added to the ledger.` },
        now,
      );
    });
  }

  function removeEvidence(id: string) {
    setWorkspace((current) =>
      appendAudit(
        {
          ...current,
          evidence: current.evidence.filter((item) => item.id !== id),
        },
        { kind: "evidence_removed", message: `${id} removed from the ledger.` },
      ),
    );
  }

  function openRecursion() {
    setWorkspace((current) =>
      appendAudit(
        {
          ...current,
          recursionOpen: true,
          recursionDepth: Math.max(1, current.recursionDepth),
        },
        {
          kind: "workspace_updated",
          message: "Only the named blocking subproblem was opened.",
        },
      ),
    );
  }

  function updateProbabilityFlow(probabilityFlow: ProbabilityFlowProtocol) {
    setWorkspace((current) => ({
      ...current,
      probabilityFlow,
      updatedAt: new Date().toISOString(),
    }));
  }

  function resolveProbabilityFlow() {
    try {
      const now = new Date().toISOString();
      const probabilityFlow = applyProbabilityFlowResolution(
        workspace.probabilityFlow,
        now,
      );
      setWorkspace((current) =>
        appendAudit(
          { ...current, probabilityFlow },
          {
            kind: "probability_flow_resolved",
            message: `${probabilityFlow.receipts[0]?.receiptId} resolved; only receipted effects are eligible for the Noesis warrant.`,
          },
          now,
        ),
      );
      setNotice({
        tone: "success",
        message:
          "Probability flow resolved and receipted. Re-run after any input changes.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? `Probability flow rejected: ${error.message}`
            : "Probability flow could not be resolved.",
      });
    }
  }

  function issueReceipt() {
    try {
      setWorkspace((current) => issueDryRunReceipt(current));
      setNotice({
        tone: "success",
        message: "Dry-run receipt recorded. The capability lease was revoked.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Receipt could not be issued.",
      });
    }
  }

  async function importWorkspace(file: File) {
    if (file.size > 1_000_000) {
      setNotice({
        tone: "error",
        message: "Workspace files must be under 1 MB.",
      });
      return;
    }

    const result = deserializeWorkspace(await file.text());
    if (!result.success) {
      setNotice({ tone: "error", message: `Import rejected: ${result.error}` });
      return;
    }

    setWorkspace(
      appendAudit(result.data, {
        kind: "workspace_imported",
        message: `Validated workspace imported from ${file.name}.`,
      }),
    );
    setNotice({
      tone: "success",
      message: "Workspace imported and validated.",
    });
  }

  function exportWorkspace() {
    const validation = parseNoesisWorkspace(workspace);

    if (!validation.success) {
      setNotice({
        tone: "error",
        message: `Export blocked: ${validation.error}`,
      });
      return;
    }

    downloadJson(
      serializeWorkspace(validation.data),
      `${workspace.workspaceId}.noesis.json`,
    );
    setNotice({ tone: "success", message: "Workspace JSON exported." });
  }

  function downloadLatestReceipt() {
    const receipt = workspace.receipts[0];
    if (!receipt) return;

    downloadJson(
      `${JSON.stringify(receipt, null, 2)}\n`,
      `${receipt.receiptId}.json`,
    );
  }

  function resetWorkspace() {
    window.localStorage.removeItem(NOESIS_STORAGE_KEY);
    setWorkspace(createInitialNoesisWorkspace());
    setNotice({
      tone: "success",
      message: "A new local workspace was created.",
    });
  }

  return (
    <main className="min-h-screen bg-[#e7ece7] text-[#121915]">
      <WorkbenchHeader
        onExport={exportWorkspace}
        onImport={importWorkspace}
        onReset={resetWorkspace}
        saveState={saveState}
      />

      <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-5 md:px-6 md:pt-7">
        <section className="border-b border-[#b9c5bd] pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#4f6859]">
                <span>Command center</span>
                <span aria-hidden="true">/</span>
                <span>{workspace.schemaVersion}</span>
                <span aria-hidden="true">/</span>
                <span>local only</span>
              </div>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.045em] text-[#101713] sm:text-4xl">
                One run. One proof line. One decision.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5e6b63]">
                Define the objective, attach falsifiable evidence, forecast
                protected-boundary risk, scope the lease, and record a portable
                receipt. Nothing leaves this browser.
              </p>
            </div>
            <nav
              aria-label="Workbench sections"
              className="flex gap-1 overflow-x-auto border border-[#c3cdc6] bg-[#f4f7f3] p-1"
            >
              {[
                ["01", "Define", "#definition"],
                ["02", "Evidence", "#evidence"],
                ["03", "Flow", "#probability-flow"],
                ["04", "Audit", "#audit"],
              ].map(([number, label, href]) => (
                <a
                  className="flex min-h-11 min-w-max items-center gap-2 px-3 py-2 text-xs font-semibold text-[#38473e] transition hover:bg-white hover:text-[#0d6a42]"
                  href={href}
                  key={href}
                >
                  <span className="font-mono text-[0.6rem] text-[#789083]">
                    {number}
                  </span>
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        {notice ? (
          <div
            aria-live="polite"
            className={`mt-4 flex items-start justify-between gap-4 border px-4 py-3 text-sm ${notice.tone === "success" ? "border-emerald-700/25 bg-emerald-50 text-emerald-950" : "border-rose-700/25 bg-rose-50 text-rose-950"}`}
          >
            <p>{notice.message}</p>
            <button
              aria-label="Dismiss message"
              className="min-h-11 px-2 font-mono text-xs opacity-60 hover:opacity-100"
              onClick={() => setNotice(null)}
              type="button"
            >
              Close
            </button>
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid min-w-0 gap-5">
            <WorkspaceEditor
              onLeaseChange={updateLease}
              onWorkspaceChange={updateWorkspace}
              workspace={workspace}
            />
            <EvidenceLedger
              evidence={workspace.evidence}
              onAdd={addEvidence}
              onChange={updateEvidence}
              onRemove={removeEvidence}
            />
            <ProbabilityFlowPanel
              flow={workspace.probabilityFlow}
              onChange={updateProbabilityFlow}
              onResolve={resolveProbabilityFlow}
            />
            <AuditTimeline workspace={workspace} />
          </div>
          <WarrantPanel
            evaluation={evaluation}
            onDownloadReceipt={downloadLatestReceipt}
            onIssueReceipt={issueReceipt}
            onOpenRecursion={openRecursion}
            onReactivateLease={() => updateLease({ active: true })}
            workspace={workspace}
          />
        </div>
      </div>
    </main>
  );
}
