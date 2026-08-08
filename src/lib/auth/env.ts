import { z } from "zod";

/**
 * Auth environment contract.
 *
 * Parsing is deliberately lazy and non-throwing at import time. A hard throw
 * would take down `next build` and every route on a machine that simply has no
 * credentials yet — which is the normal state of this repo, since the operator
 * enters secrets through the provider UI rather than committing them. Instead
 * the app builds, runs, and shows an explicit "not configured" state, and auth
 * fails loudly only where auth is actually used.
 */
export const authEnvSchema = z.object({
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters (openssl rand -base64 32)"),
  AUTH_GITHUB_ID: z.string().min(1, "AUTH_GITHUB_ID is required"),
  AUTH_GITHUB_SECRET: z.string().min(1, "AUTH_GITHUB_SECRET is required"),
  AUTH_URL: z.string().url("AUTH_URL must be an absolute URL").optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export type AuthEnvResult =
  | { ok: true; value: AuthEnv }
  | { ok: false; missing: string[] };

/**
 * Parse auth configuration from an environment-shaped record.
 *
 * Takes the source as a parameter rather than reading `process.env` directly so
 * the contract is testable without mutating global state in tests.
 */
export function parseAuthEnv(source: Record<string, string | undefined>): AuthEnvResult {
  const parsed = authEnvSchema.safeParse(source);
  if (parsed.success) {
    return { ok: true, value: parsed.data };
  }
  // Report which keys failed, never the values that failed — an error message is
  // a log line, and a log line is somewhere a secret must never land.
  const missing = parsed.error.issues.map((issue) => String(issue.path[0] ?? "unknown"));
  return { ok: false, missing: [...new Set(missing)] };
}

export function readAuthEnv(): AuthEnvResult {
  return parseAuthEnv(process.env);
}

export function isAuthConfigured(): boolean {
  return readAuthEnv().ok;
}
