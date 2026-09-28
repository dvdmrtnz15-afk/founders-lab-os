import { z } from "zod";
import { importWorkspace, parseWorkspace, type Workspace } from "./model";

export const VAULT_KEY = "truenorth.exchange.encrypted.v1";
export const MAX_VAULT_BYTES = 4_000_000;
const ITERATIONS = 310000;
const envelopeSchema = z.strictObject({
  format: z.literal("truenorth-exchange-vault"),
  version: z.literal(1),
  cipher: z.literal("AES-256-GCM"),
  kdf: z.literal("PBKDF2-SHA256"),
  iterations: z.literal(ITERATIONS),
  salt: z.string().max(30),
  iv: z.string().max(20),
  ciphertext: z.string().max(MAX_VAULT_BYTES),
});
function encode(bytes: Uint8Array): string {
  let value = "";
  for (let i = 0; i < bytes.length; i++) value += String.fromCharCode(bytes[i]);
  return btoa(value);
}
function decode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
async function derive(password: string, salt: Uint8Array<ArrayBuffer>) {
  if (password.length < 12 || password.length > 1024)
    throw new Error("Use a passphrase between 12 and 1,024 characters.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptVault(
  workspace: Workspace,
  password: string,
): Promise<string> {
  const valid = parseWorkspace(workspace);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt);
  const data = new TextEncoder().encode(JSON.stringify(valid));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode("truenorth-exchange-vault:1"),
    },
    key,
    data,
  );
  const serialized = JSON.stringify({
    format: "truenorth-exchange-vault",
    version: 1,
    cipher: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: encode(salt),
    iv: encode(iv),
    ciphertext: encode(new Uint8Array(ciphertext)),
  });
  if (serialized.length > MAX_VAULT_BYTES)
    throw new Error(
      "Vault exceeds the 4 MB limit. Reduce the number of records.",
    );
  return serialized;
}
export async function decryptVault(
  serialized: string,
  password: string,
): Promise<Workspace> {
  if (serialized.length > MAX_VAULT_BYTES)
    throw new Error("Vault exceeds the 4 MB limit.");
  try {
    const envelope = envelopeSchema.parse(JSON.parse(serialized));
    const salt = decode(envelope.salt);
    const iv = decode(envelope.iv);
    if (salt.length !== 16 || iv.length !== 12)
      throw new Error("Invalid vault");
    const key = await derive(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: new TextEncoder().encode("truenorth-exchange-vault:1"),
      },
      key,
      decode(envelope.ciphertext),
    );
    return importWorkspace(JSON.parse(new TextDecoder().decode(decrypted)));
  } catch {
    throw new Error(
      "Unable to unlock. Check the passphrase and use an unmodified Exchange vault file.",
    );
  }
}
