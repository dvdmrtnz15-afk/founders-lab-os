"use client";

import { useFormStatus } from "react-dom";

/**
 * Client boundary kept as narrow as possible: the only thing that needs
 * interactivity is the pending state of the submit button.
 */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium tracking-tight transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirecting to GitHub…" : children}
    </button>
  );
}
