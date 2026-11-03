"use client";

import { useFormStatus } from "react-dom";

/** The only interactive part of sign-in: the pending state of the button. */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="min-h-11 w-full bg-[#102019] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4935] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Redirecting to GitHub…" : children}
    </button>
  );
}
