import {
  PROBABILITY_FLOW_CANONICALIZATION_VERSION,
  PROBABILITY_FLOW_PROOF_BUNDLE_VERSION,
  computeProbabilityFlowActionRisk,
  createProbabilityFlowProofBundle,
  verifyProbabilityFlowReplay,
} from "@/lib/probability-flow";
import type {
  FlowAction,
  FlowBlockCode,
  FlowPrincipal,
  IdentityPromotion,
  ProbabilityFlowProtocol,
  ProtectedBoundary,
  WitnessReduction,
} from "@/lib/probability-flow-schema";

type ProbabilityFlowPanelProps = {
  flow: ProbabilityFlowProtocol;
  onChange: (flow: ProbabilityFlowProtocol) => void;
  onResolve: () => void;
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

const blockCodeLabel: Record<FlowBlockCode, string> = {
  action_not_authorized: "Action authority is missing",
  action_dependency_blocked: "A required action is held",
  action_dependency_cycle: "Action dependencies contain a cycle",
  autonomy_constraint_failed: "Consent, exit, or care limits failed",
  identity_promotion_blocked: "Canonical identity promotion is not warranted",
  observer_dependency_revoked: "A supporting observation expired",
  protected_boundary_crossed: "A protected boundary limit was exceeded",
  reduction_not_certified: "A required reduction is not certified",
  risk_limit_exceeded: "The action risk ceiling was exceeded",
};

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localTime.toISOString().slice(0, 16);
}

function MetricInput({
  label,
  limit,
  value,
  onChange,
}: {
  label: string;
  limit?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="noesis-label">{label}</span>
      <div className="flex min-h-11 items-center border border-[#c6d0c9] bg-white px-2.5 focus-within:border-[#137a4d]">
        <input
          aria-label={`${label} percent`}
          className="min-w-0 flex-1 bg-transparent py-2 font-mono text-sm outline-none"
          max="100"
          min="0"
          onChange={(event) =>
            onChange(clamp(Number(event.target.value) / 100))
          }
          type="number"
          value={Math.round(value * 100)}
        />
        <span className="font-mono text-xs text-[#718078]">%</span>
      </div>
      {limit ? (
        <span className="font-mono text-[0.62rem] text-[#68756d]">{limit}</span>
      ) : null}
    </label>
  );
}

export function ProbabilityFlowPanel({
  flow,
  onChange,
  onResolve,
}: ProbabilityFlowPanelProps) {
  const latestReceipt = flow.receipts[0];
  const replay = latestReceipt
    ? verifyProbabilityFlowReplay(flow, latestReceipt)
    : null;
  const currentReceipt = replay?.ok ? latestReceipt : undefined;
  const boundaryResult = new Map(
    currentReceipt?.boundaryResults.map((result) => [
      result.boundaryId,
      result,
    ]) ?? [],
  );
  const reductionResult = new Map(
    currentReceipt?.reductionResults.map((result) => [
      result.reductionId,
      result,
    ]) ?? [],
  );
  const blockedResult = new Map(
    currentReceipt?.blockedEffects.map((result) => [result.effectId, result]) ??
      [],
  );

  function patchFlow(patch: Partial<ProbabilityFlowProtocol>) {
    onChange({ ...flow, ...patch });
  }

  function updateAction(id: string, patch: Partial<FlowAction>) {
    patchFlow({
      actions: flow.actions.map((action) =>
        action.id === id ? { ...action, ...patch } : action,
      ),
    });
  }

  function updateBoundary(id: string, patch: Partial<ProtectedBoundary>) {
    patchFlow({
      boundaries: flow.boundaries.map((boundary) =>
        boundary.id === id ? { ...boundary, ...patch } : boundary,
      ),
    });
  }

  function updatePromotion(patch: Partial<IdentityPromotion>) {
    patchFlow({ identityPromotion: { ...flow.identityPromotion, ...patch } });
  }

  function updateReduction(id: string, patch: Partial<WitnessReduction>) {
    patchFlow({
      reductions: flow.reductions.map((reduction) =>
        reduction.id === id ? { ...reduction, ...patch } : reduction,
      ),
    });
  }

  function updatePrincipal(id: string, patch: Partial<FlowPrincipal>) {
    patchFlow({
      principals: flow.principals.map((principal) =>
        principal.id === id ? { ...principal, ...patch } : principal,
      ) as ProbabilityFlowProtocol["principals"],
    });
  }

  function exportProofBundle() {
    if (!latestReceipt || !replay?.ok) return;
    const bundle = createProbabilityFlowProofBundle(flow, latestReceipt);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${flow.scenarioId.replace(/[^a-z0-9-]+/gi, "-")}-ipf-proof.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  }

  return (
    <section
      aria-labelledby="probability-flow-title"
      className="border border-[#cbd4ce] bg-[#f8faf7]"
      id="probability-flow"
    >
      <div className="flex flex-col gap-4 border-b border-[#d7ddd8] px-4 py-4 sm:flex-row sm:items-end sm:justify-between md:px-5">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#52705f]">
            03 / forecast and bound effects
          </p>
          <h2
            className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#101713]"
            id="probability-flow-title"
          >
            Invariant probability flow
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#647068]">
            Forecast uncertain state, measure protected-boundary flux, then
            authorize only the dependency-closed effects whose proofs replay.
          </p>
        </div>
        <label className="noesis-check shrink-0">
          <input
            checked={flow.enabled}
            onChange={(event) => patchFlow({ enabled: event.target.checked })}
            type="checkbox"
          />
          Gate Noesis with this flow
        </label>
      </div>

      <div className="grid gap-3 border-b border-[#d7ddd8] bg-[#eef2ee] p-4 sm:grid-cols-2 xl:grid-cols-4 md:p-5">
        <div
          aria-live="polite"
          className="border border-[#cad3cd] bg-white p-3"
        >
          <p className="noesis-label">Decision</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#172119]">
            {!latestReceipt
              ? "UNRESOLVED"
              : replay?.ok
                ? latestReceipt.decision.toUpperCase().replace("_", " ")
                : "STALE — REPLAY REQUIRED"}
          </p>
        </div>
        <div className="border border-[#cad3cd] bg-white p-3">
          <p className="noesis-label">Uncertainty after lag</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#172119]">
            {percent(
              currentReceipt?.adjustedUncertainty ?? flow.baseUncertainty,
            )}
          </p>
        </div>
        <div className="border border-[#cad3cd] bg-white p-3">
          <p className="noesis-label">Bounded effects</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#172119]">
            {currentReceipt?.authorizedEffectIds.length ?? 0}/
            {flow.actions.length}
          </p>
        </div>
        <div className="border border-[#cad3cd] bg-white p-3">
          <p className="noesis-label">Lineage replay</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#172119]">
            {replay ? (replay.ok ? "MATCH" : "MISMATCH") : "NOT RUN"}
          </p>
        </div>
      </div>

      <details className="group border-b border-[#d7ddd8]">
        <summary className="flex cursor-pointer list-none flex-col gap-1 px-4 py-4 marker:content-none sm:flex-row sm:items-center sm:justify-between md:px-5">
          <span>
            <span className="noesis-label">Advanced calibration</span>
            <span className="mt-1 block text-sm font-semibold">
              Scenario, uncertainty, and risk weights
            </span>
          </span>
          <span className="font-mono text-xs text-[#65726a]">
            {flow.scenarioId} · ceiling {flow.maximumActionRisk.toFixed(2)}
          </span>
        </summary>
        <div className="grid gap-4 border-t border-[#d7ddd8] p-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem] md:p-5">
          <label className="grid gap-1.5">
            <span className="noesis-label">Scenario</span>
            <input
              className="noesis-input font-mono"
              maxLength={80}
              onChange={(event) =>
                patchFlow({ scenarioId: event.target.value })
              }
              value={flow.scenarioId}
            />
          </label>
          <MetricInput
            label="Base uncertainty"
            onChange={(baseUncertainty) => patchFlow({ baseUncertainty })}
            value={flow.baseUncertainty}
          />
          <label className="grid gap-1.5">
            <span className="noesis-label">Maximum action risk</span>
            <input
              className="noesis-input font-mono"
              max="10"
              min="0"
              onChange={(event) =>
                patchFlow({
                  maximumActionRisk: Math.min(
                    10,
                    Math.max(0, Number(event.target.value)),
                  ),
                })
              }
              step="0.01"
              type="number"
              value={flow.maximumActionRisk}
            />
          </label>
          <p className="border-l-2 border-[#639a78] bg-[#edf6ef] px-3 py-2 font-mono text-[0.65rem] leading-5 text-[#405148] md:col-span-3">
            Risk weights · tail {flow.riskWeights.tailRisk.toFixed(2)} · first
            passage {flow.riskWeights.firstPassageExposure.toFixed(2)} ·
            identity {flow.riskWeights.identityDrift.toFixed(2)} ·
            irreversibility {flow.riskWeights.irreversibility.toFixed(2)} ·
            uncertainty {flow.riskWeights.uncertainty.toFixed(2)}. These are
            visible research coefficients, not validated psychological facts.
          </p>
        </div>
      </details>

      <div className="border-t border-[#d7ddd8]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
          <div>
            <p className="noesis-label">Distributional TET resolve</p>
            <h3 className="mt-1 text-lg font-semibold text-[#101713]">
              Candidate effects
            </h3>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="min-h-11 border border-[#9aa9a0] bg-white px-4 py-2.5 text-sm font-semibold text-[#243129] transition hover:border-[#126f47] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!latestReceipt || !replay?.ok}
              onClick={exportProofBundle}
              type="button"
            >
              Export proof bundle
            </button>
            <button
              className="min-h-11 bg-[#126f47] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b5435] active:translate-y-px"
              data-testid="resolve-probability-flow"
              onClick={onResolve}
              type="button"
            >
              Resolve and receipt
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#d7ddd8] border-t border-[#d7ddd8]">
          {flow.actions.map((action) => {
            const blocked = blockedResult.get(action.id);
            const allowed = currentReceipt?.authorizedEffectIds.includes(
              action.id,
            );
            const currentRisk = computeProbabilityFlowActionRisk(
              action,
              flow,
              currentReceipt?.adjustedUncertainty ?? flow.baseUncertainty,
            );
            return (
              <article className="p-4 md:p-5" key={action.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="break-all font-mono text-[0.62rem] text-[#738078]">
                      {action.id}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-[#1c2820]">
                      {action.label}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentReceipt ? (
                      <span
                        className={`px-2 py-1 font-mono text-[0.62rem] font-semibold ${allowed ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}
                      >
                        {allowed ? "AUTHORIZED" : "HELD"}
                      </span>
                    ) : null}
                    <label className="noesis-check">
                      <input
                        checked={action.authorized}
                        onChange={(event) =>
                          updateAction(action.id, {
                            authorized: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      Authority present
                    </label>
                  </div>
                </div>
                {blocked ? (
                  <ul
                    aria-label={`Reasons ${action.label} is held`}
                    className="mt-3 grid gap-1 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-900"
                  >
                    {blocked.blockerCodes.map((code) => (
                      <li key={code}>{blockCodeLabel[code]}.</li>
                    ))}
                  </ul>
                ) : null}
                <details className="group mt-3 border border-[#d2dad5] bg-[#f2f5f2]">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-3 marker:content-none">
                    <span className="text-xs font-semibold text-[#334139]">
                      Inspect effect metrics
                    </span>
                    <span className="font-mono text-[0.65rem] text-[#647068]">
                      risk {currentRisk.toFixed(3)} /{" "}
                      {flow.maximumActionRisk.toFixed(2)} max
                    </span>
                  </summary>
                  <div className="grid gap-3 border-t border-[#d2dad5] p-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricInput
                      label="Utility"
                      onChange={(utility) =>
                        updateAction(action.id, { utility })
                      }
                      value={action.utility}
                    />
                    <MetricInput
                      label="Tail risk"
                      onChange={(tailRisk) =>
                        updateAction(action.id, { tailRisk })
                      }
                      value={action.tailRisk}
                    />
                    <MetricInput
                      label="First passage"
                      onChange={(firstPassageExposure) =>
                        updateAction(action.id, { firstPassageExposure })
                      }
                      value={action.firstPassageExposure}
                    />
                    <MetricInput
                      label="Identity drift"
                      onChange={(identityDrift) =>
                        updateAction(action.id, { identityDrift })
                      }
                      value={action.identityDrift}
                    />
                    <MetricInput
                      label="Reversibility"
                      onChange={(reversibility) =>
                        updateAction(action.id, { reversibility })
                      }
                      value={action.reversibility}
                    />
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </div>

      <details className="group border-t border-[#d7ddd8]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:content-none md:px-5">
          <span>
            <span className="noesis-label">Protected boundary flux</span>
            <span className="mt-1 block text-base font-semibold">
              First-passage and authority limits
            </span>
          </span>
          <span className="font-mono text-xs text-[#65726a] group-open:hidden">
            {currentReceipt?.boundaryResults.filter((result) => result.allowed)
              .length ?? 0}
            /{flow.boundaries.length} within bounds
          </span>
          <span className="hidden font-mono text-xs text-[#65726a] group-open:inline">
            Close
          </span>
        </summary>
        <div className="grid gap-4 border-t border-[#d7ddd8] p-4 md:p-5">
          {flow.boundaries.map((boundary) => (
            <article
              className="grid gap-3 border border-[#cad3cd] bg-white p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_10rem_11rem]"
              key={boundary.id}
            >
              <div>
                <p className="text-sm font-semibold">{boundary.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#67746c]">
                  {boundary.protectedRight}
                </p>
              </div>
              <MetricInput
                label="Outward flux"
                limit={`max ${percent(boundary.maximumOutwardFlux)}`}
                onChange={(outwardFlux) =>
                  updateBoundary(boundary.id, { outwardFlux })
                }
                value={boundary.outwardFlux}
              />
              <MetricInput
                label="Crossing probability"
                limit={`max ${percent(boundary.maximumCrossingProbability)}`}
                onChange={(crossingProbability) =>
                  updateBoundary(boundary.id, { crossingProbability })
                }
                value={boundary.crossingProbability}
              />
              <div className="grid content-start gap-2">
                <label className="noesis-check">
                  <input
                    checked={boundary.authoritySatisfied}
                    onChange={(event) =>
                      updateBoundary(boundary.id, {
                        authoritySatisfied: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  Authority satisfied
                </label>
                <span className="font-mono text-[0.62rem] text-[#68756d]">
                  {boundaryResult.get(boundary.id)?.allowed
                    ? "WITHIN BOUND"
                    : "PROTECTED / HELD"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="group border-t border-[#d7ddd8]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:content-none md:px-5">
          <span>
            <span className="noesis-label">Identity and witnesses</span>
            <span className="mt-1 block text-base font-semibold">
              Promotion liabilities and two separate 144 reductions
            </span>
          </span>
          <span className="font-mono text-xs text-[#65726a] group-open:hidden">
            {currentReceipt?.identityPromotion.allowed
              ? "promotion ready"
              : "promotion held"}
          </span>
          <span className="hidden font-mono text-xs text-[#65726a] group-open:inline">
            Close
          </span>
        </summary>
        <div className="grid gap-5 border-t border-[#d7ddd8] p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5">
              <span className="noesis-label">Promotion source</span>
              <select
                className="noesis-input"
                onChange={(event) =>
                  updatePromotion({
                    source: event.target.value as IdentityPromotion["source"],
                  })
                }
                value={flow.identityPromotion.source}
              >
                <option value="transient_affect">Transient affect</option>
                <option value="deliberative_evidence">
                  Deliberative evidence
                </option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="noesis-label">Open contradictions</span>
              <input
                className="noesis-input font-mono"
                min="0"
                onChange={(event) =>
                  updatePromotion({
                    unresolvedContradictions: Math.max(
                      0,
                      Number(event.target.value),
                    ),
                  })
                }
                type="number"
                value={flow.identityPromotion.unresolvedContradictions}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="noesis-label">Trust liabilities</span>
              <input
                className="noesis-input font-mono"
                min="0"
                onChange={(event) =>
                  updatePromotion({
                    unresolvedTrustLiabilities: Math.max(
                      0,
                      Number(event.target.value),
                    ),
                  })
                }
                type="number"
                value={flow.identityPromotion.unresolvedTrustLiabilities}
              />
            </label>
            <div className="grid gap-2 self-end">
              <label className="noesis-check">
                <input
                  checked={flow.identityPromotion.requested}
                  onChange={(event) =>
                    updatePromotion({ requested: event.target.checked })
                  }
                  type="checkbox"
                />
                Promotion requested
              </label>
              <label className="noesis-check">
                <input
                  checked={flow.identityPromotion.explicitAuthority}
                  onChange={(event) =>
                    updatePromotion({ explicitAuthority: event.target.checked })
                  }
                  type="checkbox"
                />
                Explicit promotion authority
              </label>
            </div>
          </div>

          {currentReceipt && !currentReceipt.identityPromotion.allowed ? (
            <ul className="grid gap-1 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-900">
              {currentReceipt.identityPromotion.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : null}

          <div className="grid gap-3 xl:grid-cols-2">
            {flow.reductions.map((reduction) => {
              const result = reductionResult.get(reduction.id);
              return (
                <article
                  className="border border-[#cad3cd] bg-white p-4"
                  key={reduction.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-[#52705f]">
                        {reduction.sourceSystem.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        144 coordinates · separate semantics
                      </p>
                    </div>
                    <span className="bg-amber-100 px-2 py-1 font-mono text-[0.6rem] text-amber-950">
                      RESEARCH SCAFFOLDING
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#68756d]">
                    {reduction.semanticRole}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MetricInput
                      label="Reconstruction error"
                      limit={`max ${percent(reduction.maximumReconstructionError)}`}
                      onChange={(reconstructionError) =>
                        updateReduction(reduction.id, { reconstructionError })
                      }
                      value={reduction.reconstructionError}
                    />
                    <div className="grid content-start gap-1.5">
                      <span className="noesis-label">Retained witnesses</span>
                      <p className="text-xs leading-5 text-[#56645b]">
                        {reduction.retainedWitnessKinds.join(" · ")}
                      </p>
                      <span className="font-mono text-[0.62rem] text-[#68756d]">
                        {result?.certified ? "CERTIFIED" : "NOT CERTIFIED"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
            Shared cardinality is not semantic equivalence. The personality
            interaction system and Identity Bloom&apos;s 12×12 behavioral graph
            remain separately identified, witnessed, and error-certified.
          </p>
        </div>
      </details>

      <details className="group border-t border-[#d7ddd8]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:content-none md:px-5">
          <span>
            <span className="noesis-label">Observer lag and care</span>
            <span className="mt-1 block text-base font-semibold">
              Revocation chain and two-principal autonomy
            </span>
          </span>
          <span className="font-mono text-xs text-[#65726a] group-open:hidden">
            {currentReceipt?.expiredObserverIds.length ?? 0} expired
          </span>
          <span className="hidden font-mono text-xs text-[#65726a] group-open:inline">
            Close
          </span>
        </summary>
        <div className="grid gap-5 border-t border-[#d7ddd8] p-4 xl:grid-cols-2 md:p-5">
          <div>
            <p className="noesis-label">Observer freshness</p>
            <div className="mt-3 grid gap-3">
              {flow.observers.map((observer) => (
                <article
                  className="border border-[#cad3cd] bg-white p-3"
                  key={observer.id}
                >
                  <p className="text-sm font-semibold">{observer.label}</p>
                  <label className="mt-3 grid gap-1.5">
                    <span className="noesis-label">Expires</span>
                    <input
                      className="noesis-input"
                      onChange={(event) =>
                        patchFlow({
                          observers: flow.observers.map((candidate) =>
                            candidate.id === observer.id
                              ? {
                                  ...candidate,
                                  expiresAt: new Date(
                                    event.target.value,
                                  ).toISOString(),
                                }
                              : candidate,
                          ),
                        })
                      }
                      type="datetime-local"
                      value={toDateTimeLocal(observer.expiresAt)}
                    />
                  </label>
                </article>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#66736b]">
              Expiry increases uncertainty and invalidates dependent evidence,
              plans, certificates, leases, and effects transitively.
            </p>
          </div>

          <div>
            <p className="noesis-label">Autonomy-preserving care flow</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {flow.principals.map((principal) => (
                <article
                  className="border border-[#cad3cd] bg-white p-3"
                  key={principal.id}
                >
                  <p className="text-sm font-semibold">{principal.label}</p>
                  <div className="mt-3 grid gap-2">
                    <label className="noesis-check">
                      <input
                        checked={principal.consent}
                        onChange={(event) =>
                          updatePrincipal(principal.id, {
                            consent: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      Consent present
                    </label>
                    <label className="noesis-check">
                      <input
                        checked={principal.rightToExit}
                        onChange={(event) =>
                          updatePrincipal(principal.id, {
                            rightToExit: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      Right to exit preserved
                    </label>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-3 grid gap-px border border-[#cad3cd] bg-[#cad3cd] sm:grid-cols-3">
              {flow.careFlow.map((sample) => (
                <article className="bg-white p-3" key={sample.horizon}>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-[#52705f]">
                    {sample.horizon}
                  </p>
                  <p className="mt-2 text-xs text-[#56645b]">
                    Harm {percent(sample.harm)} / max{" "}
                    {percent(flow.careConstraints.maximumHarm)}
                  </p>
                  <p className="mt-1 text-xs text-[#56645b]">
                    Boundary {percent(sample.boundaryRespect)} / min{" "}
                    {percent(flow.careConstraints.minimumBoundaryRespect)}
                  </p>
                </article>
              ))}
            </div>
            {currentReceipt && !currentReceipt.autonomyResult.allowed ? (
              <ul className="mt-3 grid gap-1 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-900">
                {currentReceipt.autonomyResult.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-[#66736b]">
              Care, commitment, and repair are tracked across timescales, but
              they never compensate for missing consent, agency, safety,
              truthfulness, or exit.
            </p>
          </div>
        </div>
      </details>

      <div className="border-t border-[#d7ddd8] bg-[#101713] px-4 py-3 text-white md:px-5">
        <p className="break-words font-mono text-[0.6rem] leading-5 text-white/55">
          Protocol v{flow.schemaVersion} · proof bundle v
          {PROBABILITY_FLOW_PROOF_BUNDLE_VERSION} · canonicalization{" "}
          {PROBABILITY_FLOW_CANONICALIZATION_VERSION} · local marker{" "}
          {currentReceipt?.inputDigest ??
            (latestReceipt ? "stale" : "unresolved")}{" "}
          is not a cryptographic signature · all psychological weights are
          unvalidated research scaffolding · historical facts remain immutable
          while interpretations may version
        </p>
      </div>
    </section>
  );
}
