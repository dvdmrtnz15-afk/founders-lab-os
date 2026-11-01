import { describe, expect, it } from "vitest";
import {
  generateSigningKey,
  sha256Canonical,
  signPayload,
  verifyEnvelope,
} from "./signing";

const at = "2026-11-01T00:00:00.000Z";

describe("signed envelopes", async () => {
  const key = await generateSigningKey();
  const other = await generateSigningKey();
  const trusted = new Set([key.keyId]);
  const options = { purpose: "persona", trustedKeyIds: trusted };

  it("verifies an untouched envelope from a trusted key", async () => {
    const envelope = await signPayload({ a: 1, b: [2, 3] }, "persona", key, at);
    expect(envelope.keyId).toMatch(/^[0-9a-f]{32}$/);
    expect(await verifyEnvelope(envelope, options)).toEqual({
      ok: true,
      reasons: [],
    });
  });

  it("is independent of key order", async () => {
    const envelope = await signPayload({ b: 1, a: 2 }, "persona", key, at);
    const reordered = { ...envelope, payload: { a: 2, b: 1 } };
    expect((await verifyEnvelope(reordered, options)).ok).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const envelope = await signPayload({ ceiling: "low" }, "persona", key, at);
    const result = await verifyEnvelope(
      { ...envelope, payload: { ceiling: "critical" } },
      options,
    );
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("digest does not match the payload");
  });

  it("rejects a recomputed digest with a stale signature", async () => {
    const envelope = await signPayload({ v: 1 }, "persona", key, at);
    const forged = await signPayload({ v: 2 }, "persona", other, at);
    const result = await verifyEnvelope(
      { ...envelope, payload: { v: 2 }, digest: forged.digest },
      options,
    );
    expect(result.reasons).toEqual(["signature is invalid"]);
  });

  it("rejects a valid signature from an untrusted key", async () => {
    const envelope = await signPayload({ v: 1 }, "persona", other, at);
    const result = await verifyEnvelope(envelope, options);
    expect(result.reasons).toEqual([`key ${other.keyId} is not trusted`]);
  });

  it("rejects a swapped public key under a trusted key id", async () => {
    const envelope = await signPayload({ v: 1 }, "persona", other, at);
    const result = await verifyEnvelope(
      { ...envelope, keyId: key.keyId },
      options,
    );
    expect(result.reasons).toContain("key id does not match the public key");
  });

  it("separates purposes so a persona signature cannot pass as a receipt", async () => {
    const envelope = await signPayload({ v: 1 }, "persona", key, at);
    const result = await verifyEnvelope(envelope, {
      purpose: "execution-receipt",
      trustedKeyIds: trusted,
    });
    expect(result.ok).toBe(false);
  });

  it("reports malformed envelopes instead of throwing", async () => {
    const envelope = await signPayload({ v: 1 }, "persona", key, at);
    const result = await verifyEnvelope(
      { ...envelope, publicKey: "not base64!" },
      options,
    );
    expect(result.ok).toBe(false);
    expect(result.reasons[0]).toContain("malformed");
  });

  it("keeps the private key non-extractable", () => {
    expect(key.privateKey.extractable).toBe(false);
  });

  it("hashes canonically", async () => {
    expect(await sha256Canonical({ a: 1, b: 2 })).toBe(
      await sha256Canonical({ b: 2, a: 1 }),
    );
  });
});
