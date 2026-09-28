import { describe, expect, it } from "vitest";
import {
  approvePacket,
  assetSchema,
  createWorkspace,
  economics,
  importWorkspace,
  packetApprovalValid,
  parseWorkspace,
  researchWarrant,
  reviewPacket,
  updateAsset,
  updateMandate,
} from "./model";

describe("Exchange calculations and scope", () => {
  it("calculates NOI, debt cash flow, cap rate and occupancy stress from explicit inputs", () => {
    const asset = {
      ...createWorkspace().assets[0],
      price: 500000,
      monthlyRent: 4000,
      monthlyExpenses: 1000,
      occupancy: 75,
      annualDebtService: 18000,
      closingCosts: 15000,
    };
    expect(economics(asset)).toEqual({
      gross: 36000,
      expenses: 12000,
      noi: 24000,
      cashFlow: 6000,
      capRate: 4.8,
      acquisition: 515000,
    });
    expect(economics(asset, 60).noi).toBe(16800);
    expect(economics({ ...asset, price: 0 }).capRate).toBeNull();
    expect(economics(asset, 0).cashFlow).toBe(-30000);
  });
  it("rejects unsafe URLs, nonfinite inputs and invalid occupancy", () => {
    const asset = createWorkspace().assets[0];
    for (const sourceUrl of [
      "javascript:alert(1)",
      "data:text/html,test",
      "file:///etc/passwd",
    ])
      expect(assetSchema.safeParse({ ...asset, sourceUrl }).success).toBe(
        false,
      );
    expect(assetSchema.safeParse({ ...asset, price: -1 }).success).toBe(false);
    expect(assetSchema.safeParse({ ...asset, price: Infinity }).success).toBe(
      false,
    );
    expect(() => economics(asset, NaN)).toThrow();
    expect(() => economics(asset, 101)).toThrow();
  });
  it("uses the existing Noesis engine and refuses an unapproved packet", () => {
    const w = createWorkspace();
    expect(researchWarrant(w, w.assets[0]).decision).toBe("blocked");
    expect(() => reviewPacket(w, w.assets[0])).toThrow(/Approve/);
    const approved = approvePacket(w, w.assets[0]);
    expect(researchWarrant(approved, approved.assets[0]).decision).toBe(
      "allowed",
    );
    expect(reviewPacket(approved, approved.assets[0])).toContain(
      "No professional review, outreach, offer",
    );
    expect(reviewPacket(approved, approved.assets[0])).toContain(
      "ILLUSTRATIVE SAMPLE",
    );
  });
  it("invalidates approval when the asset or mandate changes", () => {
    const w = createWorkspace();
    const approved = approvePacket(w, w.assets[0]);
    const edited = updateAsset(approved, { ...approved.assets[0], price: 1 });
    expect(edited.assets[0].revision).toBe(2);
    expect(packetApprovalValid(edited, edited.assets[0])).toBe(false);
    const revised = updateMandate(approved, { ...approved.mandate, budget: 1 });
    expect(packetApprovalValid(revised, revised.assets[0])).toBe(false);
    expect(() => approvePacket(edited, approved.assets[0])).toThrow(/changed/);
  });
  it("clears imported authority and rejects malformed or duplicate workspace records", () => {
    const w = createWorkspace();
    const approved = approvePacket(w, w.assets[0]);
    expect(importWorkspace(approved).approvals).toEqual([]);
    expect(() =>
      parseWorkspace({ ...w, assets: [w.assets[0], w.assets[0]] }),
    ).toThrow();
    expect(() => parseWorkspace({ ...w, version: 9 })).toThrow();
    expect(() => parseWorkspace({ ...w, secret: "unexpected" })).toThrow();
  });
});
