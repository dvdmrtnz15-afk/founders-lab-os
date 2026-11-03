"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ExpertAccess } from "@/lib/auth/access";
import type { ExpertSpec } from "@/lib/experts/expert-schema";

type ConsultResponse = {
  accepted: boolean;
  summary: string;
  expert: { ref: string; title: string } | null;
  answer: Record<string, unknown> | null;
  servedBy: string | null;
  contractProblems: string[];
  review: {
    verdict: "pass" | "warn" | "block";
    reason: string;
    score: number;
  } | null;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: ConsultResponse };

const verdictTone = {
  pass: "border-emerald-600 bg-emerald-50 text-emerald-950",
  warn: "border-amber-500 bg-amber-50 text-amber-950",
  block: "border-rose-500 bg-rose-50 text-rose-950",
} as const;

export function AskExpert({
  access,
  expert,
  task,
}: {
  access: ExpertAccess;
  expert: ExpertSpec;
  task: string;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  // The parent keys this component on expert and task, so a new task starts
  // from a clean state. Cancel any in-flight request when it unmounts.
  useEffect(() => () => controller.current?.abort(), []);

  async function ask() {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/experts/consult", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task }),
        signal: current.signal,
      });
      const body = (await response.json()) as ConsultResponse & {
        error?: string;
      };
      if (!response.ok) {
        setState({
          status: "error",
          message: body.error ?? "The expert could not answer.",
        });
        return;
      }
      setState({ status: "done", result: body });
    } catch {
      if (!current.signal.aborted) {
        setState({ status: "error", message: "Network error. Try again." });
      }
    }
  }

  if (access !== "allowed") {
    const copy = {
      unconfigured: "Live answers are not configured on this deployment yet.",
      anonymous: "Sign in with GitHub to get a live, reviewed answer.",
      not_allowed:
        "Your account is not on this deployment's allowlist for live answers.",
    }[access];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-[#8ea196] bg-[#f4f7f3] p-4">
        <p className="text-sm text-[#38473e]">{copy}</p>
        {access === "anonymous" ? (
          <Link
            className="min-h-11 bg-[#102019] px-4 py-2.5 text-sm font-semibold text-white"
            href="/sign-in?from=/experts"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3" data-testid="ask-expert">
      <button
        className="min-h-12 bg-[#102019] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4935] disabled:cursor-wait disabled:opacity-60"
        disabled={state.status === "loading"}
        onClick={ask}
        type="button"
      >
        {state.status === "loading"
          ? `${expert.title} is working, then a reviewer checks it…`
          : `Ask the ${expert.title}`}
      </button>

      {state.status === "error" ? (
        <p
          className="border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-950"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "done" ? (
        <article
          aria-live="polite"
          className="border border-[#cbd4ce] bg-white"
        >
          {state.result.review ? (
            <p
              className={`border-l-4 px-4 py-3 text-sm ${verdictTone[state.result.review.verdict]}`}
            >
              <span className="font-semibold uppercase">
                Review: {state.result.review.verdict}
              </span>{" "}
              {state.result.review.reason}
            </p>
          ) : (
            <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {state.result.summary}
            </p>
          )}
          {state.result.answer ? (
            <div className="grid gap-4 p-4">
              {expert.deliverable.map((section) => {
                const value = state.result.answer?.[section.id];
                return typeof value === "string" && value ? (
                  <section key={section.id}>
                    <h3 className="noesis-label">{section.label}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#1c2a22]">
                      {value}
                    </p>
                  </section>
                ) : null;
              })}
              {Array.isArray(state.result.answer.assumptions) &&
              state.result.answer.assumptions.length > 0 ? (
                <section>
                  <h3 className="noesis-label">Assumptions</h3>
                  <ul className="mt-1 list-disc pl-5 text-sm text-[#38473e]">
                    {state.result.answer.assumptions.map((item) => (
                      <li key={String(item)}>{String(item)}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
          {state.result.contractProblems.length > 0 ? (
            <p className="border-t border-[#d7ddd8] px-4 py-3 text-xs text-rose-900">
              Contract problems: {state.result.contractProblems.join("; ")}
            </p>
          ) : null}
          <p className="border-t border-[#d7ddd8] px-4 py-2 font-mono text-[0.6rem] text-[#6c766f]">
            {state.result.servedBy
              ? `answered by ${state.result.servedBy}`
              : ""}
            {state.result.accepted ? " · accepted" : " · not accepted"}
          </p>
        </article>
      ) : null}
    </div>
  );
}
