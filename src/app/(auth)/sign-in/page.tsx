import type { Metadata } from "next";
import { signIn } from "@/lib/auth/config";
import { isAuthConfigured } from "@/lib/auth/env";
import { getPrincipal } from "@/lib/auth/session";
import { SubmitButton } from "./submit-button";

export const metadata: Metadata = { title: "Sign in" };

const ERROR_COPY: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already linked to a different sign-in method.",
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

  // Only accept a same-origin relative path as a redirect target. An absolute
  // URL here would turn the sign-in page into an open redirect.
  const redirectTo = from && from.startsWith("/") && !from.startsWith("//") ? from : "/";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
        Sign in
      </h1>
      <p className="mt-3 text-sm opacity-70">
        FounderLab OS uses your GitHub account. No password is stored here.
      </p>

      {principal ? (
        <p className="mt-8 rounded-md border border-current/15 px-4 py-3 text-sm">
          Already signed in as{" "}
          <span className="font-medium">{principal.name ?? principal.email ?? principal.id}</span>.
        </p>
      ) : configured ? (
        <>
          {error ? (
            <p
              role="alert"
              className="mt-8 rounded-md border border-current/25 px-4 py-3 text-sm"
            >
              {ERROR_COPY[error] ?? "Sign-in failed. Try again."}
            </p>
          ) : null}

          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("github", { redirectTo });
            }}
          >
            <SubmitButton>Continue with GitHub</SubmitButton>
          </form>
        </>
      ) : (
        // An honest unconfigured state. Rendering a dead button that fails on
        // click would be the demo-ware version of this screen.
        <div className="mt-8 rounded-md border border-current/20 px-4 py-4 text-sm">
          <p className="font-medium">Sign-in is not configured on this environment.</p>
          <p className="mt-2 opacity-70">
            The operator needs to set <code>AUTH_SECRET</code>, <code>AUTH_GITHUB_ID</code>, and{" "}
            <code>AUTH_GITHUB_SECRET</code>. See <code>.env.example</code> and{" "}
            <code>docs/architecture/AUTH.md</code>.
          </p>
        </div>
      )}
    </main>
  );
}
