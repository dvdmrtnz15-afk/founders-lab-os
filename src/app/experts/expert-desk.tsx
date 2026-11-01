"use client";

import { useMemo, useState } from "react";
import { compileExpertBrief } from "@/lib/experts/compile";
import { routeTask } from "@/lib/experts/router";
import { getPersona } from "@/lib/persona/registry";

const EXAMPLES = [
  "The checkout page crashes with a stack trace after the last deploy",
  "Review this pull request diff before we merge",
  "Should we split the monolith into microservices? Write an ADR",
  "Audit our auth flow for XSS and CSRF vulnerabilities",
  "Draft a PRD with acceptance criteria for onboarding",
  "Pull a tarot card for my full moon ritual",
];

const effortCopy = {
  low: "Light: fast and direct",
  medium: "Standard: balanced depth",
  high: "Deep: careful reasoning",
  xhigh: "Maximum: hardest problems",
} as const;

const warrantTone = {
  low: "bg-[#dff3e6] text-[#0f3d26]",
  medium: "bg-[#f6ebc4] text-[#3d300a]",
  high: "bg-[#f6d3d7] text-[#4a0f17]",
  critical: "bg-[#f6d3d7] text-[#4a0f17]",
} as const;

export function ExpertDesk() {
  const [task, setTask] = useState(EXAMPLES[0]);
  const [copied, setCopied] = useState(false);
  const route = useMemo(() => routeTask(task), [task]);
  const primary = route.primary?.expert ?? null;
  const persona = primary ? getPersona(primary.personaRef) : undefined;
  const brief = useMemo(
    () => (primary ? compileExpertBrief(primary, task, route.effort) : null),
    [primary, task, route.effort],
  );

  async function copyBrief() {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(
        `${brief.system}\n\n---\nTask:\n${brief.userMessage}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-16 pt-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="grid content-start gap-4">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#52705f]">
            Expert desk
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#101713] sm:text-4xl">
            The right Claude expert for every task.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#5e6b63]">
            Not a character to chat with. A specialist with a method, a
            deliverable you can check, an independent reviewer, and limits it
            cannot cross.
          </p>
        </div>

        <label className="grid gap-1.5">
          <span className="noesis-label">Describe the task</span>
          <textarea
            className="noesis-input min-h-32 text-base"
            data-testid="task-input"
            maxLength={4000}
            onChange={(event) => setTask(event.target.value)}
            value={task}
          />
        </label>

        <div>
          <p className="noesis-label">Try one</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  className={`min-h-11 border px-3 py-2 text-left text-xs leading-5 transition ${task === example ? "border-[#0d6a42] bg-white text-[#0d6a42]" : "border-[#c3cdc6] bg-[#f4f7f3] text-[#38473e] hover:border-[#8ea196]"}`}
                  onClick={() => setTask(example)}
                  type="button"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-live="polite"
        className="grid content-start gap-4"
        data-testid="routing-result"
      >
        {!primary ? (
          <div className="border border-[#cbd4ce] bg-[#f8faf7] p-5">
            <p className="text-base font-semibold text-[#101713]">
              Not enough to route yet.
            </p>
            <p className="mt-1 text-sm text-[#5e6b63]">
              {route.clarifyingQuestion}
            </p>
          </div>
        ) : (
          <>
            <article className="overflow-hidden border border-[#24352d] bg-[#0b120f] text-[#f3f7f2]">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/45">
                    Routed to
                  </p>
                  <h2
                    className="mt-1 text-2xl font-semibold tracking-[-0.03em]"
                    data-testid="routed-expert"
                  >
                    {primary.title}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {primary.promise}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 font-mono text-[0.62rem] uppercase ${warrantTone[route.suggestedWarrant]}`}
                >
                  {route.suggestedWarrant} risk
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-px bg-white/10 text-xs sm:grid-cols-4">
                {[
                  ["Model", "Claude Opus 5.5"],
                  ["Effort", effortCopy[route.effort]],
                  ["Reviewer", route.reviewer?.title ?? "None"],
                  ["Confidence", `${Math.round(route.confidence * 100)}%`],
                ].map(([label, value]) => (
                  <div className="bg-[#0b120f] p-3" key={label}>
                    <dt className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-white/40">
                      {label}
                    </dt>
                    <dd className="mt-1 font-medium text-white/85">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-white/10 p-5 text-xs leading-5 text-white/60">
                <p>
                  <span className="text-white/40">Why: </span>
                  matched{" "}
                  {route.primary!.matched.map((m) => `"${m}"`).join(", ")}
                </p>
                <p className="mt-1">
                  <span className="text-white/40">Effort: </span>
                  {route.effortReasons.join("; ")}
                </p>
                {persona ? (
                  <p className="mt-1">
                    <span className="text-white/40">Boundary: </span>
                    {persona.governingLaw}
                  </p>
                ) : null}
              </div>
            </article>

            {route.clarifyingQuestion ? (
              <p className="border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {route.clarifyingQuestion}
              </p>
            ) : null}

            {route.exceedsPersonaCeiling ? (
              <p className="border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-950">
                This task touches {route.riskSignals.join(", ")}, which is above
                what a {primary.title} may act on. It can advise, but a human
                approval is required before anything changes.
              </p>
            ) : null}

            {route.alsoConsult.length > 0 ? (
              <p className="text-sm text-[#38473e]">
                <span className="noesis-label mr-2">Also consult</span>
                {route.alsoConsult.map((m) => m.expert.title).join(", ")}
              </p>
            ) : null}

            <div className="border border-[#cbd4ce] bg-[#f8faf7] p-5">
              <p className="noesis-label">You will get</p>
              <ol className="mt-2 grid gap-2">
                {primary.deliverable.map((section, index) => (
                  <li className="flex gap-3 text-sm" key={section.id}>
                    <span className="font-mono text-[0.65rem] text-[#789083]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="font-semibold text-[#101713]">
                        {section.label}.
                      </span>{" "}
                      <span className="text-[#5e6b63]">{section.guidance}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="noesis-label mt-4">
                {route.reviewer?.title ?? "Reviewer"} checks
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-[#38473e]">
                {primary.rubric.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </div>

            {brief ? (
              <details className="border border-[#cbd4ce] bg-white">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#1c3126]">
                  Expert brief sent to Claude
                  <span className="font-mono text-[0.6rem] font-normal text-[#6c766f]">
                    {brief.model} · effort {brief.effort}
                  </span>
                </summary>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-[#d7ddd8] bg-[#f4f7f3] p-4 font-mono text-[0.7rem] leading-5 text-[#26342c]">
                  {brief.system}
                </pre>
                <div className="border-t border-[#d7ddd8] p-3">
                  <button
                    className="min-h-11 border border-[#8ea196] bg-white px-3 py-2 text-sm font-semibold text-[#1c3126] transition hover:border-[#1f6e49] hover:text-[#0d6a42]"
                    onClick={copyBrief}
                    type="button"
                  >
                    {copied ? "Copied" : "Copy brief and task"}
                  </button>
                </div>
              </details>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
