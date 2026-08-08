import { describe, expect, it } from "vitest";
import { authorizeOwnership, toPrincipal, type Principal } from "./authorization";
import { parseAuthEnv } from "./env";

const userA: Principal = { id: "user-a", email: "a@example.com", name: "A" };
const userB: Principal = { id: "user-b", email: "b@example.com", name: "B" };

const validEnv = {
  AUTH_SECRET: "x".repeat(32),
  AUTH_GITHUB_ID: "github-client-id",
  AUTH_GITHUB_SECRET: "github-client-secret",
};

describe("authorizeOwnership", () => {
  it("allows a principal to act on a resource it owns", () => {
    expect(authorizeOwnership(userA, "user-a")).toEqual({ ok: true });
  });

  it("rejects an anonymous caller", () => {
    expect(authorizeOwnership(null, "user-a")).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
  });

  /**
   * The cross-user test. This is the highest-value auth assertion in the repo:
   * it is what stops the next query someone writes from being readable by the
   * wrong principal. It must fail closed even though both users are genuine,
   * authenticated accounts.
   */
  it("denies user B access to a resource owned by user A", () => {
    expect(authorizeOwnership(userB, userA.id)).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });

  it("reports NOT_FOUND rather than FORBIDDEN so ownership cannot be enumerated", () => {
    const foreign = authorizeOwnership(userB, userA.id);
    const missing = authorizeOwnership(userB, null);
    expect(foreign).toEqual(missing);
  });

  it("treats a missing owner id as unowned rather than public", () => {
    expect(authorizeOwnership(userA, undefined).ok).toBe(false);
    expect(authorizeOwnership(userA, "").ok).toBe(false);
  });
});

describe("toPrincipal", () => {
  it("maps a session user with a stable id", () => {
    expect(toPrincipal({ id: "user-a", email: "a@example.com", name: "A" })).toEqual(userA);
  });

  it("rejects a session user with no usable id", () => {
    expect(toPrincipal({ email: "a@example.com" })).toBeNull();
    expect(toPrincipal({ id: "" })).toBeNull();
    expect(toPrincipal(null)).toBeNull();
    expect(toPrincipal("user-a")).toBeNull();
  });

  it("defaults absent profile fields to null instead of undefined", () => {
    expect(toPrincipal({ id: "user-a" })).toEqual({
      id: "user-a",
      email: null,
      name: null,
    });
  });
});

describe("parseAuthEnv", () => {
  it("accepts a complete configuration", () => {
    const result = parseAuthEnv(validEnv);
    expect(result.ok).toBe(true);
  });

  it("rejects a short AUTH_SECRET", () => {
    const result = parseAuthEnv({ ...validEnv, AUTH_SECRET: "too-short" });
    expect(result).toEqual({ ok: false, missing: ["AUTH_SECRET"] });
  });

  it("reports every missing key at once", () => {
    const result = parseAuthEnv({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(
      expect.arrayContaining(["AUTH_SECRET", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"]),
    );
  });

  it("never echoes a submitted value in its failure report", () => {
    const result = parseAuthEnv({ ...validEnv, AUTH_GITHUB_SECRET: "" });
    expect(JSON.stringify(result)).not.toContain("github-client-id");
  });

  it("treats AUTH_URL as optional but rejects a non-URL when present", () => {
    expect(parseAuthEnv(validEnv).ok).toBe(true);
    expect(parseAuthEnv({ ...validEnv, AUTH_URL: "not-a-url" }).ok).toBe(false);
  });
});
