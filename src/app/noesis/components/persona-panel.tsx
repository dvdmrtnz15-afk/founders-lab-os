"use client";

import { useState } from "react";
import type { NoesisWorkspace } from "@/lib/noesis-schema";
import { aggregateCouncil, type CouncilVote } from "@/lib/persona/council";
import { personaFingerprint, toolPermitted } from "@/lib/persona/persona";
import { parsePersonaSpec } from "@/lib/persona/persona-schema";
import { PERSONA_REGISTRY } from "@/lib/persona/registry";
import { lintPersonaOutput } from "@/lib/persona/stylometric";

type PersonaPanelProps = {
  workspace: NoesisWorkspace;
  onPersonaChange: (ref: string | null) => void;
  onCouncilChange: (council: CouncilVote[]) => void;
};

const selectable = PERSONA_REGISTRY.filter((p) => p.parentRef !== null);

const outcomeCopy = {
  no_objection: "No objection · adds no proof",
  hold: "Hold · objections open",
  veto: "Veto · authority blocked",
  invalid: "Invalid council",
} as const;

export function PersonaPanel({
  workspace,
  onPersonaChange,
  onCouncilChange,
}: PersonaPanelProps) {
  const [draft, setDraft] = useState("");
  const [voter, setVoter] = useState("");
  const [verdict, setVerdict] = useState<CouncilVote["verdict"]>("warn");
  const [hardVeto, setHardVeto] = useState(false);
  const [reason, setReason] = useState("");

  const parsed = parsePersonaSpec(workspace.persona);
  const persona = parsed.success ? parsed.data : null;
  const council = workspace.council ?? [];
  const aggregate =
    council.length > 0 ? aggregateCouncil(council, persona?.ref ?? null) : null;
  const lint =
    persona && draft.trim() ? lintPersonaOutput(persona, draft) : null;
  const voterOptions = selectable.filter(
    (p) =>
      p.ref !== persona?.ref && !council.some((v) => v.personaRef === p.ref),
  );

  function addVote() {
    if (!voter || reason.trim().length < 3) return;
    onCouncilChange([
      ...council,
      {
        personaRef: voter,
        verdict,
        score: verdict === "pass" ? 1 : verdict === "warn" ? 0.5 : 0,
        reason: reason.trim(),
        hardVeto: verdict === "block" && hardVeto,
      },
    ]);
    setVoter("");
    setReason("");
    setHardVeto(false);
  }

  return (
    <section
      aria-labelledby="persona-title"
      className="border border-[#cbd4ce] bg-[#f8faf7]"
      id="persona"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d7ddd8] px-4 py-4 md:px-5">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#52705f]">
            Who is acting
          </p>
          <h2
            className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#101713]"
            id="persona-title"
          >
            Persona &amp; council
          </h2>
        </div>
        <label className="grid min-w-[14rem] gap-1.5">
          <span className="noesis-label">Acting persona</span>
          <select
            className="noesis-input"
            data-testid="persona-select"
            onChange={(event) => onPersonaChange(event.target.value || null)}
            value={persona?.ref ?? ""}
          >
            <option value="">None (kernel only)</option>
            {selectable.map((p) => (
              <option key={p.ref} value={p.ref}>
                {p.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {workspace.persona !== undefined && !persona ? (
        <p className="px-4 py-4 text-sm text-rose-900 md:px-5">
          The attached persona is invalid and blocks the warrant. Choose a
          registered persona to replace it.
        </p>
      ) : null}

      {persona ? (
        <div className="grid gap-5 p-4 md:grid-cols-2 md:p-5">
          <div className="grid content-start gap-4">
            <div>
              <p className="text-base font-semibold text-[#101713]">
                {persona.displayName}
              </p>
              <p className="mt-0.5 break-all font-mono text-[0.62rem] text-[#6c766f]">
                {persona.ref} · v{persona.version} ·{" "}
                {personaFingerprint(persona).slice(8, 20)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#38473e]">
                {persona.mission}
              </p>
            </div>

            <p className="border-l-2 border-[#0d6a42] pl-3 text-sm font-medium leading-6 text-[#1c3126]">
              {persona.governingLaw}
            </p>

            <dl className="grid gap-2.5">
              {(["style", "decision", "social"] as const).map((key) => (
                <div key={key}>
                  <div className="flex justify-between gap-3 text-xs">
                    <dt className="noesis-label">{key}</dt>
                    <dd className="text-[#38473e]">
                      {persona.axes[key].adjective}
                    </dd>
                  </div>
                  <div className="mt-1 h-1 bg-[#dfe5e0]" aria-hidden="true">
                    <div
                      className="h-full bg-[#4f7d63]"
                      style={{
                        width: `${Math.round(persona.axes[key].level * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-2 gap-3 font-mono text-[0.65rem] text-[#38473e]">
              <p>
                <span className="block text-[#6c766f]">CEILING</span>
                {persona.riskCeiling}
              </p>
              <p>
                <span className="block text-[#6c766f]">HUMAN AT</span>
                {persona.escalateAtOrAbove ?? "never"}
              </p>
            </div>

            <div>
              <p className="noesis-label">Lease tools</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {workspace.lease.tools.map((tool) => {
                  const ok = toolPermitted(persona, tool);
                  return (
                    <li
                      className={`border px-2 py-1 font-mono text-[0.65rem] ${ok ? "border-[#9fbfab] bg-white text-[#1c3126]" : "border-rose-300 bg-rose-50 text-rose-900 line-through"}`}
                      key={tool}
                    >
                      {tool}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="grid grid-cols-2 gap-3 text-xs leading-5 text-[#38473e]">
              <div>
                <p className="noesis-label">Do</p>
                <ul className="mt-1 list-disc pl-4">
                  {persona.voice.do.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="noesis-label">Avoid</p>
                <ul className="mt-1 list-disc pl-4">
                  {persona.voice.avoid.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>

            <label className="grid gap-1.5">
              <span className="noesis-label">
                Check a draft against this voice
              </span>
              <textarea
                className="noesis-input min-h-24"
                maxLength={4000}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Paste agent output to lint it locally."
                value={draft}
              />
            </label>
            {lint ? (
              <p
                aria-live="polite"
                className={`border-l-2 pl-3 text-xs leading-5 ${lint.ok ? "border-emerald-600 text-emerald-900" : "border-rose-500 text-rose-900"}`}
              >
                {lint.ok
                  ? "Draft fits this persona's voice rules."
                  : [
                      lint.bannedPhrases.length
                        ? `Banned: ${lint.bannedPhrases.join(", ")}.`
                        : "",
                      lint.claimTerms.length
                        ? `Overclaims: ${lint.claimTerms.join(", ")}.`
                        : "",
                      lint.missingRequiredMarker
                        ? `Needs one of: ${persona.voice.mustIncludeAny.join(", ")}.`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t border-[#d7ddd8] bg-[#eef2ee] p-4 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="noesis-label">Review council</p>
          {aggregate ? (
            <p className="font-mono text-[0.65rem] text-[#38473e]">
              {outcomeCopy[aggregate.outcome]}
            </p>
          ) : (
            <p className="font-mono text-[0.65rem] text-[#6c766f]">
              Votes can veto or hold. They never count as proof.
            </p>
          )}
        </div>

        {council.length > 0 ? (
          <ul className="mt-3 divide-y divide-[#d7ddd8] border border-[#d7ddd8] bg-white">
            {council.map((vote, index) => (
              <li
                className="flex items-start justify-between gap-3 px-3 py-2 text-xs"
                key={`${vote.personaRef}-${index}`}
              >
                <span>
                  <span className="font-mono font-semibold">
                    {vote.verdict.toUpperCase()}
                    {vote.hardVeto && vote.verdict === "block" ? " · VETO" : ""}
                  </span>{" "}
                  <span className="text-[#6c766f]">{vote.personaRef}</span>
                  <span className="mt-0.5 block text-[#38473e]">
                    {vote.reason}
                  </span>
                </span>
                <button
                  aria-label={`Remove vote from ${vote.personaRef}`}
                  className="min-h-11 px-2 font-mono text-[0.65rem] text-[#8b4b54] underline underline-offset-4"
                  onClick={() =>
                    onCouncilChange(council.filter((_, i) => i !== index))
                  }
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem] md:grid-cols-[12rem_7rem_minmax(0,1fr)_auto]">
          <select
            aria-label="Reviewing persona"
            className="noesis-input"
            onChange={(event) => setVoter(event.target.value)}
            value={voter}
          >
            <option value="">Reviewer…</option>
            {voterOptions.map((p) => (
              <option key={p.ref} value={p.ref}>
                {p.displayName}
              </option>
            ))}
          </select>
          <select
            aria-label="Verdict"
            className="noesis-input"
            onChange={(event) =>
              setVerdict(event.target.value as CouncilVote["verdict"])
            }
            value={verdict}
          >
            <option value="pass">pass</option>
            <option value="warn">warn</option>
            <option value="block">block</option>
          </select>
          <input
            aria-label="Reason"
            className="noesis-input sm:col-span-2 md:col-span-1"
            maxLength={240}
            onChange={(event) => setReason(event.target.value)}
            placeholder="One-sentence reason"
            value={reason}
          />
          <div className="flex items-center gap-3 sm:col-span-2 md:col-span-1">
            {verdict === "block" ? (
              <label className="noesis-check min-h-11">
                <input
                  checked={hardVeto}
                  onChange={(event) => setHardVeto(event.target.checked)}
                  type="checkbox"
                />
                Hard veto
              </label>
            ) : null}
            <button
              className="min-h-11 border border-[#8ea196] bg-white px-3 py-2 text-sm font-semibold text-[#1c3126] transition hover:border-[#1f6e49] hover:text-[#0d6a42] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={
                !voter || reason.trim().length < 3 || council.length >= 12
              }
              onClick={addVote}
              type="button"
            >
              Add vote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
