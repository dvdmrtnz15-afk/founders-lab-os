import type { Metadata } from "next";
import Link from "next/link";
import { expertAccess, readAllowlist } from "@/lib/auth/access";
import { isAuthConfigured } from "@/lib/auth/env";
import { getPrincipal } from "@/lib/auth/session";
import { ExpertDesk } from "./expert-desk";

// Access depends on the visitor's session, so this page renders per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Expert Desk · FounderLab OS",
  description:
    "Route any task to the right Claude expert: a method, a checkable deliverable, an independent reviewer, and governed limits.",
};

export default async function ExpertsPage() {
  const configured = isAuthConfigured();
  const principal = await getPrincipal();
  const access = expertAccess(configured, principal, readAllowlist());

  return (
    <main className="min-h-screen bg-[#e7ece7] text-[#121915]">
      <header className="border-b border-[#bdc8c0] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-8 w-8 place-items-center bg-[#102019] font-mono text-[0.68rem] font-bold text-[#a9f1c6]">
              FL
            </span>
            <span className="text-sm font-semibold">FounderLab OS</span>
          </Link>
          <nav aria-label="Experts" className="flex items-center gap-1">
            <Link
              className="min-h-11 px-3 py-2.5 text-sm font-semibold text-[#176c48]"
              href="/noesis"
            >
              Noesis
            </Link>
            {configured ? (
              <Link
                className="min-h-11 border border-[#8ea196] bg-white px-3 py-2.5 text-sm font-semibold text-[#1c3126]"
                href="/sign-in?from=/experts"
              >
                {principal ? (principal.name ?? "Account") : "Sign in"}
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      <ExpertDesk access={access} />
    </main>
  );
}
