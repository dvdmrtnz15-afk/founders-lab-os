import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signOut } from "@/lib/auth/config";
import { isAuthConfigured } from "@/lib/auth/env";
import { safeReturnPath } from "@/lib/auth/redirect";
import { getPrincipal } from "@/lib/auth/session";
import { SubmitButton } from "./submit-button";

export const metadata: Metadata = { title: "Sign in · FounderLab OS" };

const ERROR_COPY: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already linked to a different sign-in method.",
  AccessDenied: "GitHub declined the sign-in request.",
  Configuration: "Sign-in is not configured correctly. Check the server logs.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const configured = isAuthConfigured();
  const principal = await getPrincipal();
  const redirectTo = safeReturnPath(from);

  return (
    <main className="grid min-h-screen place-items-center bg-[#e7ece7] px-4 py-16 text-[#121915]">
      <section className="w-full max-w-md border border-[#cbd4ce] bg-[#f8faf7] p-6">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid h-8 w-8 place-items-center bg-[#102019] font-mono text-[0.68rem] font-bold text-[#a9f1c6]">
            FL
          </span>
          <span className="text-sm font-semibold">FounderLab OS</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#5e6b63]">
          Uses your GitHub account. No password is stored here.
        </p>

        {principal ? (
          <div className="mt-6 grid gap-3">
            <p className="border border-[#cbd4ce] bg-white px-4 py-3 text-sm">
              Signed in as{" "}
              <span className="font-semibold">
                {principal.name ?? principal.email ?? principal.id}
              </span>
              .
            </p>
            <Link
              className="min-h-11 bg-[#102019] px-4 py-3 text-center text-sm font-semibold text-white"
              href={redirectTo}
            >
              Continue
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                className="min-h-11 w-full border border-[#8ea196] bg-white px-4 py-2 text-sm font-semibold text-[#1c3126]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : configured ? (
          <>
            {error ? (
              <p
                className="mt-6 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-950"
                role="alert"
              >
                {ERROR_COPY[error] ?? "Sign-in failed. Try again."}
              </p>
            ) : null}
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo });
              }}
              className="mt-6"
            >
              <SubmitButton>Continue with GitHub</SubmitButton>
            </form>
          </>
        ) : (
          <div className="mt-6 border border-[#cbd4ce] bg-white px-4 py-4 text-sm">
            <p className="font-semibold">
              Sign-in is not configured on this deployment.
            </p>
            <p className="mt-2 text-[#5e6b63]">
              The operator needs to set <code>AUTH_SECRET</code>,{" "}
              <code>AUTH_GITHUB_ID</code>, and <code>AUTH_GITHUB_SECRET</code>.
              See <code>docs/architecture/AUTH.md</code>.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
