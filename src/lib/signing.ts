import { stableStringify } from "./hash";

/**
 * Ed25519 signed envelopes over canonical JSON, using only WebCrypto (Node 20+
 * and current browsers), so there is no new dependency.
 *
 * FNV-1a fingerprints detect accidental edits; these signatures prove who
 * issued a persona or receipt and that it has not been altered since. A
 * verifier must pass the key ids it trusts. An envelope signed by any other
 * key fails, even if the signature itself is mathematically valid.
 */

export const SIGNATURE_ALGORITHM = "Ed25519" as const;

export type SignedEnvelope<T> = {
  /** What was signed. */
  payload: T;
  /** Domain separation: what kind of object this is, e.g. "persona". */
  purpose: string;
  alg: typeof SIGNATURE_ALGORITHM;
  /** First 32 hex chars of SHA-256 over the raw public key. */
  keyId: string;
  /** Raw 32-byte public key, base64url. */
  publicKey: string;
  /** SHA-256 hex of the signed bytes. */
  digest: string;
  /** Ed25519 signature over the signed bytes, base64url. */
  signature: string;
  signedAt: string;
};

export type SigningKey = {
  keyId: string;
  publicKey: string;
  privateKey: CryptoKey;
};

export type EnvelopeVerification = { ok: boolean; reasons: string[] };

function subtle(): SubtleCrypto {
  const api = globalThis.crypto?.subtle;
  if (!api) throw new Error("WebCrypto is unavailable in this runtime.");
  return api;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error("Not base64url.");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const hash = new Uint8Array(await subtle().digest("SHA-256", bytes));
  return [...hash].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 hex over the canonical JSON of any value. */
export async function sha256Canonical(value: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(stableStringify(value));
  const bytes = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  bytes.set(encoded);
  return sha256Hex(bytes);
}

async function keyIdFor(
  rawPublicKey: Uint8Array<ArrayBuffer>,
): Promise<string> {
  return (await sha256Hex(rawPublicKey)).slice(0, 32);
}

/** Bytes that are actually signed: purpose, time, and payload together. */
function signedBytes(
  purpose: string,
  signedAt: string,
  payload: unknown,
): Uint8Array<ArrayBuffer> {
  const text = stableStringify([
    "founderlab-signed-v1",
    purpose,
    signedAt,
    payload,
  ]);
  const encoded = new TextEncoder().encode(text);
  const bytes = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  bytes.set(encoded);
  return bytes;
}

/**
 * Creates a signing key. The private key is non-extractable: it can sign in
 * this runtime but cannot be exported, logged, or serialized.
 */
export async function generateSigningKey(): Promise<SigningKey> {
  const pair = (await subtle().generateKey(
    { name: SIGNATURE_ALGORITHM },
    false,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const raw = new Uint8Array(await subtle().exportKey("raw", pair.publicKey));
  return {
    keyId: await keyIdFor(raw),
    publicKey: toBase64Url(raw),
    privateKey: pair.privateKey,
  };
}

export async function signPayload<T>(
  payload: T,
  purpose: string,
  key: SigningKey,
  signedAt = new Date().toISOString(),
): Promise<SignedEnvelope<T>> {
  const bytes = signedBytes(purpose, signedAt, payload);
  const signature = await subtle().sign(
    { name: SIGNATURE_ALGORITHM },
    key.privateKey,
    bytes,
  );
  return {
    payload,
    purpose,
    alg: SIGNATURE_ALGORITHM,
    keyId: key.keyId,
    publicKey: key.publicKey,
    digest: await sha256Hex(bytes),
    signature: toBase64Url(signature),
    signedAt,
  };
}

/**
 * Verifies an envelope. Never throws; every failure is a reason. Checks, in
 * order: algorithm, expected purpose, trusted key, key id binding, digest,
 * and the signature itself.
 */
export async function verifyEnvelope(
  envelope: SignedEnvelope<unknown>,
  options: { purpose: string; trustedKeyIds: ReadonlySet<string> },
): Promise<EnvelopeVerification> {
  const reasons: string[] = [];
  try {
    if (envelope.alg !== SIGNATURE_ALGORITHM) {
      reasons.push(`unsupported algorithm ${String(envelope.alg)}`);
    }
    if (envelope.purpose !== options.purpose) {
      reasons.push(`purpose ${envelope.purpose} is not ${options.purpose}`);
    }
    if (!options.trustedKeyIds.has(envelope.keyId)) {
      reasons.push(`key ${envelope.keyId} is not trusted`);
    }

    const raw = fromBase64Url(envelope.publicKey);
    if (raw.byteLength !== 32) reasons.push("public key is not 32 bytes");
    if ((await keyIdFor(raw)) !== envelope.keyId) {
      reasons.push("key id does not match the public key");
    }

    const bytes = signedBytes(
      envelope.purpose,
      envelope.signedAt,
      envelope.payload,
    );
    if ((await sha256Hex(bytes)) !== envelope.digest) {
      reasons.push("digest does not match the payload");
    }

    if (reasons.length === 0) {
      const publicKey = await subtle().importKey(
        "raw",
        raw,
        { name: SIGNATURE_ALGORITHM },
        false,
        ["verify"],
      );
      const valid = await subtle().verify(
        { name: SIGNATURE_ALGORITHM },
        publicKey,
        fromBase64Url(envelope.signature),
        bytes,
      );
      if (!valid) reasons.push("signature is invalid");
    }
  } catch (error) {
    reasons.push(
      `envelope is malformed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
  return { ok: reasons.length === 0, reasons };
}
