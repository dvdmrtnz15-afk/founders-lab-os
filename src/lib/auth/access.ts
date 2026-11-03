import type { Principal } from "./authorization";

/**
 * Who may spend the operator's Claude API key.
 *
 * Signing in proves who someone is; it must not be enough to run up the bill.
 * Live expert answers are limited to an explicit allowlist of GitHub numeric
 * user ids (stable, unlike usernames, which can be changed and re-registered).
 * An empty or missing allowlist allows nobody: the default is closed.
 */
export type ExpertAccess =
  | "unconfigured"
  | "anonymous"
  | "not_allowed"
  | "allowed";

const GITHUB_ID = /^[0-9]{1,20}$/;

/** Parses `EXPERT_ALLOWED_GITHUB_IDS="123, 456"`; ignores anything malformed. */
export function parseAllowlist(raw: string | undefined): ReadonlySet<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => GITHUB_ID.test(id)),
  );
}

export function readAllowlist(): ReadonlySet<string> {
  return parseAllowlist(process.env.EXPERT_ALLOWED_GITHUB_IDS);
}

export function expertAccess(
  authConfigured: boolean,
  principal: Principal | null,
  allowlist: ReadonlySet<string>,
): ExpertAccess {
  if (!authConfigured) return "unconfigured";
  if (!principal) return "anonymous";
  return allowlist.has(principal.id) ? "allowed" : "not_allowed";
}
