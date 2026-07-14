"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  evaluateWarrant,
  initialNoesisSnapshot,
  openBlockingRecursion,
  verifyBlockingEvidence,
  type EvidenceStatus,
  type NoesisSnapshot,
} from "@/lib/noesis";

const statusStyles: Record<EvidenceStatus, string> = {
  verified: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  pending: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

const decisionCopy = {
  allowed: {
    eyebrow: "Warrant satisfied",
    title: "Action may proceed",
    body: "Proof coverage, uncertainty, verifier independence, and lease scope agree.",
    tone: "text-emerald-200",
    badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  verify: {
    eyebrow: "Verification required",
    title: "Action is held",
    body: "The proposal is coherent, but proof is not yet strong enough to authorize execution.",
    tone: "text-amber-100",
    badge: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  },
  blocked: {
    eyebrow: "Warrant denied",
    title: "Action is blocked",
    body: "A failed proof, inactive lease, or insufficient evidence prevents execution.",
    tone: "text-rose-100",
    badge: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  },
};

const resolveStages = [
  ["01", "Canonicalize", "Freeze intent, state, constraints, and authority."],
  ["02", "Diagnose", "Name uncertainty and isolate the real blocker."],
  ["03", "Recurse", "Open only the blocking subproblem within budget."],
  ["04", "Verify", "Use independent evidence; confidence is not proof."],
  ["05", "Resolve", "Allow, hold, or deny with a durable receipt."],
];

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function NoesisWorkbench() {
  const [snapshot, setSnapshot] = useState<NoesisSnapshot>(
    initialNoesisSnapshot,
  );
  const [receiptIssued, setReceiptIssued] = useState(false);
  const evaluation = useMemo(() => evaluateWarrant(snapshot), [snapshot]);
  const decision = decisionCopy[evaluation.decision];
  const coverageDegrees = Math.round(evaluation.coverage * 360);

  function reset() {
    setSnapshot(initialNoesisSnapshot);
    setReceiptIssued(false);
  }

  function toggleLease() {
    setSnapshot((current) => ({
      ...current,
      lease: { ...current.lease, active: !current.lease.active },
    }));
    setReceiptIssued(false);
  }

  return (
    <main className="min-h-screen bg-[#07110e] text-[#ecf5ef]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:48px_48px]" />

      <header className="relative border-b border-white/10 bg-[#07110e]/90 px-4 py-3 backdrop-blur md:px-7">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-white/65 transition hover:border-emerald-300/50 hover:text-emerald-100"
              href="/"
            >
              FounderLab OS
            </Link>
            <span className="h-4 w-px bg-white/15" />
            <p className="font-mono text-xs font-semibold tracking-[0.14em] text-emerald-200">
              TET NOESIS™ / REFERENCE WORKBENCH
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/55">
            <span className="rounded-full border border-white/10 px-2.5 py-1">
              Local simulation
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1">
              No external actions
            </span>
            <a
              className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-emerald-100 transition hover:bg-emerald-300/15"
              download
              href="/tet-noesis-contract.yaml"
            >
              Agent contract ↓
            </a>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1600px] px-4 pb-16 pt-10 md:px-7 md:pt-16">
        <div className="grid gap-8 border-b border-white/10 pb-12 xl:grid-cols-[minmax(0,1fr)_31rem] xl:items-end">
          <div>
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Warranted autonomy / public preview 0.1
            </p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-[5.8rem]">
              Think recursively.
              <span className="block text-white/38">Act only with proof.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/58 md:text-lg">
              A governed metacognitive control plane where reflection proposes,
              evidence decides, and every permitted action carries a scoped
              lease plus a verifiable receipt.
            </p>
          </div>

          <section className="border border-white/12 bg-white/[0.035] p-5 md:p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p
                  className={`font-mono text-[0.65rem] uppercase tracking-[0.2em] ${decision.tone}`}
                >
                  {decision.eyebrow}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                  {decision.title}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/52">
                  {decision.body}
                </p>
              </div>
              <div
                aria-label={`${percent(evaluation.coverage)} proof coverage`}
                className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#6ee7b7 ${coverageDegrees}deg, rgba(255,255,255,.09) 0deg)`,
                }}
              >
                <div className="grid h-[4.85rem] w-[4.85rem] place-items-center rounded-full bg-[#07110e] text-center">
                  <span className="text-xl font-semibold">
                    {percent(evaluation.coverage)}
                  </span>
                  <span className="-mt-3 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/45">
                    proof
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-px bg-white/10">
              {[
                ["Uncertainty", percent(snapshot.uncertainty)],
                ["Recursion", `depth ${snapshot.recursionDepth}`],
                ["Lease", snapshot.lease.active ? "active" : "revoked"],
              ].map(([label, value]) => (
                <div className="bg-[#0b1713] px-3 py-3" key={label}>
                  <p className="font-mono text-[0.56rem] uppercase tracking-[0.13em] text-white/38">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/85">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 py-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,.65fr)]">
          <div className="grid gap-5">
            <section className="border border-white/12 bg-[#0b1713]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/38">
                    Canonical state / NS-0001
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Objective under review
                  </h2>
                </div>
                <span
                  className={`border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] ${decision.badge}`}
                >
                  {evaluation.decision}
                </span>
              </div>
              <div className="grid gap-px bg-white/10 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="bg-[#0b1713] p-5">
                  <p className="text-xl leading-8 tracking-[-0.02em] text-white/90">
                    {snapshot.objective}
                  </p>
                  <p className="mt-4 border-l-2 border-emerald-300/55 pl-4 text-sm leading-6 text-white/52">
                    {snapshot.canonicalState}
                  </p>
                </div>
                <div className="bg-[#0a1512] p-5">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-white/38">
                    Blocking subproblem
                  </p>
                  <p className="mt-3 text-sm leading-6 text-amber-50/80">
                    {snapshot.blocker}
                  </p>
                  <p className="mt-4 font-mono text-[0.62rem] leading-5 text-white/36">
                    Scope:{" "}
                    {snapshot.recursionOpen
                      ? "open / isolated"
                      : "closed / parent frozen"}
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-white/12 bg-[#0b1713]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/38">
                    Evidence ledger
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Proof before permission
                  </h2>
                </div>
                <p className="font-mono text-xs text-white/38">
                  {
                    snapshot.evidence.filter(
                      (item) => item.status === "verified",
                    ).length
                  }
                  /{snapshot.evidence.length} verified
                </p>
              </div>
              <div className="divide-y divide-white/8">
                {snapshot.evidence.map((item, index) => (
                  <article
                    className="grid gap-3 px-5 py-4 md:grid-cols-[2rem_minmax(0,1fr)_11rem_6rem] md:items-center"
                    key={item.id}
                  >
                    <span className="font-mono text-[0.62rem] text-white/25">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium text-white/88">
                        {item.label}
                      </h3>
                      <p className="mt-1 font-mono text-[0.62rem] text-white/38">
                        {item.source}
                      </p>
                    </div>
                    <p className="font-mono text-[0.61rem] uppercase tracking-[0.1em] text-white/34">
                      {item.independent ? "independent" : "first-party"} /{" "}
                      {item.weight}w
                    </p>
                    <span
                      className={`w-fit border px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-5">
            <section className="border border-white/12 bg-[#0b1713] p-5">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/38">
                Semantic capability lease
              </p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {snapshot.lease.scope}
                  </h2>
                  <p className="mt-2 font-mono text-[0.63rem] leading-5 text-white/38">
                    {snapshot.lease.budget}
                  </p>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${snapshot.lease.active ? "bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.7)]" : "bg-rose-400"}`}
                />
              </div>
              <div className="mt-5 space-y-2">
                {snapshot.lease.tools.map((tool) => (
                  <div
                    className="flex items-center gap-3 border border-white/8 bg-white/[0.025] px-3 py-2.5"
                    key={tool}
                  >
                    <span className="text-emerald-200">↳</span>
                    <span className="font-mono text-[0.65rem] text-white/58">
                      {tool}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="mt-4 w-full border border-white/12 px-3 py-2.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-white/55 transition hover:border-white/25 hover:text-white"
                onClick={toggleLease}
                type="button"
              >
                {snapshot.lease.active ? "Revoke lease" : "Restore lease"}
              </button>
            </section>

            <section className="border border-white/12 bg-[#0b1713] p-5">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/38">
                TET Resolve
              </p>
              <div className="mt-4 space-y-4">
                <button
                  className="w-full bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#07110e] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/28"
                  disabled={snapshot.recursionOpen}
                  onClick={() => setSnapshot(openBlockingRecursion)}
                  type="button"
                >
                  {snapshot.recursionOpen
                    ? "Blocking recursion isolated"
                    : "Open blocking subproblem"}
                </button>
                <button
                  className="w-full border border-emerald-300/35 bg-emerald-300/8 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.025] disabled:text-white/25"
                  disabled={
                    !snapshot.recursionOpen || evaluation.decision === "allowed"
                  }
                  onClick={() => setSnapshot(verifyBlockingEvidence)}
                  type="button"
                >
                  Run independent verifier
                </button>
                <button
                  className="w-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
                  disabled={evaluation.decision !== "allowed"}
                  onClick={() => setReceiptIssued(true)}
                  type="button"
                >
                  Issue simulated execution receipt
                </button>
              </div>
              {receiptIssued ? (
                <div className="mt-4 border border-emerald-300/25 bg-emerald-300/8 p-3 font-mono text-[0.62rem] leading-5 text-emerald-100">
                  RECEIPT NR-0001 · allowed · proof{" "}
                  {percent(evaluation.coverage)} · lease active · external
                  execution disabled
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {evaluation.blockers.map((blocker) => (
                    <p
                      className="border-l border-amber-300/40 pl-3 font-mono text-[0.62rem] leading-5 text-white/42"
                      key={blocker}
                    >
                      {blocker}
                    </p>
                  ))}
                </div>
              )}
              <button
                className="mt-5 font-mono text-[0.61rem] uppercase tracking-[0.14em] text-white/38 underline decoration-white/15 underline-offset-4 transition hover:text-white/70"
                onClick={reset}
                type="button"
              >
                Reset reference state
              </button>
            </section>
          </aside>
        </div>

        <section className="mt-1 border border-white/12 bg-[#0b1713]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/38">
              Controlled reasoning sequence
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              One blocker. One proof line. One decision.
            </h2>
          </div>
          <div className="grid divide-y divide-white/8 md:grid-cols-5 md:divide-x md:divide-y-0">
            {resolveStages.map(([number, title, detail]) => (
              <article className="min-h-44 p-5" key={number}>
                <p className="font-mono text-[0.62rem] text-emerald-200/60">
                  {number}
                </p>
                <h3 className="mt-7 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/42">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-px bg-white/10 md:grid-cols-3">
          {[
            [
              "Governed memory",
              "Claims keep provenance, retention class, and contradiction status. Memory informs; it never authorizes.",
            ],
            [
              "Offline improvement",
              "Candidate changes run through sandbox evaluation, protected tests, approval, canary release, and rollback.",
            ],
            [
              "No consciousness claims",
              "Workspace coordination and self-modeling are implemented as functional mechanisms only.",
            ],
          ].map(([title, detail]) => (
            <article className="bg-[#0b1713] p-5" key={title}>
              <h2 className="text-sm font-semibold text-white/82">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-white/40">{detail}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
