import {
  formatPercent,
  warrantPolicies,
  type WarrantEvaluation,
} from "@/lib/noesis";
import type { NoesisWorkspace } from "@/lib/noesis-schema";

type WarrantPanelProps = {
  evaluation: WarrantEvaluation;
  workspace: NoesisWorkspace;
  onDownloadReceipt: () => void;
  onIssueReceipt: () => void;
  onOpenRecursion: () => void;
  onReactivateLease: () => void;
};

const decisionCopy = {
  allowed: {
    label: "Warrant satisfied",
    title: "Ready for a bounded dry run",
    tone: "bg-[#a9f1c6] text-[#07130d]",
  },
  verify: {
    label: "Verification required",
    title: "Hold and close the proof gaps",
    tone: "bg-[#f3dc93] text-[#201804]",
  },
  blocked: {
    label: "Authority blocked",
    title: "Execution is not permitted",
    tone: "bg-[#f0a9b1] text-[#25090d]",
  },
};

export function WarrantPanel({
  evaluation,
  workspace,
  onDownloadReceipt,
  onIssueReceipt,
  onOpenRecursion,
  onReactivateLease,
}: WarrantPanelProps) {
  const decision = decisionCopy[evaluation.decision];
  const policy = warrantPolicies[workspace.warrantLevel];
  const latestReceipt = workspace.receipts[0];
  const hasInactiveLease = evaluation.blockers.some(
    (blocker) => blocker.code === "lease_inactive",
  );
  const stateReady =
    workspace.title.trim().length >= 3 &&
    workspace.objective.trim().length >= 3 &&
    workspace.canonicalState.trim().length >= 3;
  const proofReady =
    evaluation.evidenceCount > 0 &&
    evaluation.coverage >= policy.minimumCoverage &&
    (!policy.requiresIndependentVerification ||
      evaluation.independentVerification) &&
    !evaluation.blockers.some((blocker) => blocker.code === "evidence_failed");
  const leaseReady = !evaluation.blockers.some((blocker) =>
    [
      "approval_missing",
      "lease_budget_missing",
      "lease_expired",
      "lease_inactive",
      "lease_scope_missing",
      "lease_tools_missing",
    ].includes(blocker.code),
  );

  return (
    <aside className="order-first lg:order-last" aria-label="Warrant decision">
      <div className="lg:sticky lg:top-[4.5rem]">
        <section className="overflow-hidden border border-[#24352d] bg-[#0b120f] text-[#f3f7f2]">
          <div className={`px-4 py-3 ${decision.tone}`} aria-live="polite">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] opacity-70">
              {decision.label}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              {decision.title}
            </h2>
          </div>

          <div className="p-4 md:p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-white/42">
                  Weighted proof
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-[-0.05em]">
                  {formatPercent(evaluation.coverage)}
                </p>
              </div>
              <div className="text-right font-mono text-[0.65rem] leading-5 text-white/48">
                <p>target {formatPercent(policy.minimumCoverage)}</p>
                <p>
                  uncertainty {formatPercent(workspace.uncertainty)} /{" "}
                  {formatPercent(policy.maximumUncertainty)}
                </p>
              </div>
            </div>
            <div
              aria-label={`${formatPercent(evaluation.coverage)} weighted proof coverage`}
              className="mt-4 h-1.5 overflow-hidden bg-white/10"
              role="progressbar"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(evaluation.coverage * 100)}
            >
              <div
                className="h-full bg-[#79e5a5] transition-[width] duration-300"
                style={{ width: formatPercent(evaluation.coverage) }}
              />
            </div>

            <div className="mt-5 border-l border-white/15 pl-4">
              {[
                ["State", stateReady],
                ["Proof", proofReady],
                ["Lease", leaseReady],
                ["Receipt", Boolean(latestReceipt)],
              ].map(([label, complete], index) => (
                <div
                  className="relative flex items-center justify-between gap-4 py-2"
                  key={String(label)}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[1.18rem] h-2 w-2 rounded-full ring-4 ring-[#0b120f] ${complete ? "bg-[#79e5a5]" : "bg-white/20"}`}
                  />
                  <span className="text-sm text-white/70">
                    {index + 1}. {label}
                  </span>
                  <span className="font-mono text-[0.6rem] uppercase text-white/38">
                    {complete ? "ready" : "open"}
                  </span>
                </div>
              ))}
            </div>

            {evaluation.blockers.length > 0 ? (
              <div className="mt-5 space-y-2" data-testid="warrant-blockers">
                {evaluation.blockers.slice(0, 4).map((blocker) => (
                  <p
                    className="border-l border-amber-200/40 pl-3 text-xs leading-5 text-white/54"
                    key={blocker.code}
                  >
                    {blocker.message}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-5 border-l border-emerald-300/50 pl-3 text-xs leading-5 text-white/58">
                Current evidence, uncertainty, authority, and lease scope
                satisfy the declared policy.
              </p>
            )}

            <div className="mt-5 grid gap-2">
              {evaluation.decision === "allowed" ? (
                <button
                  className="bg-[#a9f1c6] px-4 py-3 text-sm font-semibold text-[#07130d] transition hover:bg-white active:translate-y-px"
                  data-testid="issue-receipt"
                  onClick={onIssueReceipt}
                  type="button"
                >
                  Record dry-run receipt
                </button>
              ) : null}
              {hasInactiveLease ? (
                <button
                  className="border border-[#79e5a5]/35 px-4 py-3 text-sm font-semibold text-[#bcefd0] transition hover:border-[#79e5a5]"
                  onClick={onReactivateLease}
                  type="button"
                >
                  Start a new bounded lease
                </button>
              ) : null}
              <button
                className="border border-white/12 px-4 py-2.5 text-sm text-white/62 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                disabled={workspace.recursionOpen}
                onClick={onOpenRecursion}
                type="button"
              >
                {workspace.recursionOpen
                  ? "Blocking scope isolated"
                  : "Isolate blocking subproblem"}
              </button>
            </div>

            <p className="mt-4 font-mono text-[0.6rem] leading-4 text-white/34">
              Adapter: local dry run · external tools disabled · lease revokes
              after receipt
            </p>
          </div>
        </section>

        {latestReceipt ? (
          <section className="border-x border-b border-[#cbd4ce] bg-[#eef2ee] p-4 text-[#172119]">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[#567060]">
              Latest receipt
            </p>
            <p className="mt-2 truncate font-mono text-xs font-semibold">
              {latestReceipt.receiptId}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[#68736b]">
                Lease revoked after dry run
              </span>
              <button
                className="text-xs font-semibold text-[#0d6a42] underline decoration-[#0d6a42]/30 underline-offset-4"
                onClick={onDownloadReceipt}
                type="button"
              >
                Download JSON
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
