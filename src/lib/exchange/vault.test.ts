import { describe, expect, it } from "vitest";
import { approvePacket, createWorkspace } from "./model";
import { decryptVault, encryptVault, MAX_VAULT_BYTES } from "./vault";

const password = "a sufficiently long test passphrase";
describe("Exchange encrypted vault", () => {
  it("round-trips data, randomizes encryption, and clears imported approvals", async () => {
    const w = createWorkspace();
    const approved = approvePacket(w, w.assets[0]);
    const encrypted = await encryptVault(approved, password);
    expect(encrypted).not.toContain(w.assets[0].name);
    expect(encrypted).not.toContain(password);
    expect(await encryptVault(approved, password)).not.toBe(encrypted);
    const restored = await decryptVault(encrypted, password);
    expect(restored.assets).toEqual(w.assets);
    expect(restored.mandate).toEqual(w.mandate);
    expect(restored.approvals).toEqual([]);
  });
  it("fails closed for wrong passwords, changed ciphertext, malformed formats and short passwords", async () => {
    const encrypted = await encryptVault(createWorkspace(), password);
    await expect(
      decryptVault(encrypted, "wrong but sufficiently long password"),
    ).rejects.toThrow(/Unable to unlock/);
    const changed = JSON.parse(encrypted);
    changed.ciphertext =
      (changed.ciphertext[0] === "A" ? "B" : "A") + changed.ciphertext.slice(1);
    await expect(
      decryptVault(JSON.stringify(changed), password),
    ).rejects.toThrow();
    await expect(decryptVault("{}", password)).rejects.toThrow();
    await expect(encryptVault(createWorkspace(), "short")).rejects.toThrow(
      /12/,
    );
  });
  it("bounds untrusted input before attempting key derivation", async () => {
    await expect(
      decryptVault("x".repeat(MAX_VAULT_BYTES + 1), password),
    ).rejects.toThrow(/4 MB/);
    const envelope = JSON.parse(
      await encryptVault(createWorkspace(), password),
    );
    envelope.iterations = 999999999;
    await expect(
      decryptVault(JSON.stringify(envelope), password),
    ).rejects.toThrow();
  });
});
