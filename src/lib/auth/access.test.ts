import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./redirect";
import { expertAccess, parseAllowlist } from "./access";

const principal = { id: "262467635", email: null, name: "Owner" };

describe("parseAllowlist", () => {
  it("parses comma-separated GitHub numeric ids and drops anything else", () => {
    expect([...parseAllowlist(" 262467635, 42 ,octocat,, 1e3, -5 ")]).toEqual([
      "262467635",
      "42",
    ]);
  });

  it("is empty when unset, so the default allows nobody", () => {
    expect(parseAllowlist(undefined).size).toBe(0);
    expect(parseAllowlist("").size).toBe(0);
  });
});

describe("expertAccess", () => {
  const allow = new Set(["262467635"]);

  it("reports unconfigured before anything else", () => {
    expect(expertAccess(false, principal, allow)).toBe("unconfigured");
  });

  it("separates anonymous, not allowed, and allowed", () => {
    expect(expertAccess(true, null, allow)).toBe("anonymous");
    expect(expertAccess(true, { ...principal, id: "999" }, allow)).toBe(
      "not_allowed",
    );
    expect(expertAccess(true, principal, allow)).toBe("allowed");
  });

  it("denies a signed-in user when the allowlist is empty", () => {
    expect(expertAccess(true, principal, new Set())).toBe("not_allowed");
  });
});

describe("safeReturnPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeReturnPath("/experts")).toBe("/experts");
    expect(safeReturnPath("/experts?x=1")).toBe("/experts?x=1");
  });

  it("refuses anything that could leave the site", () => {
    for (const from of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "",
      undefined,
      null,
    ]) {
      expect(safeReturnPath(from)).toBe("/");
    }
  });
});
