import { describe, it, expect } from "vitest";
import { generateKey } from "../keys";
import { decryptDriveBlob, encryptDriveBlob } from "../drive";

describe("drive crypto", () => {
  function makeIdentity() {
    const generated = generateKey();
    return { ...generated, nsec: generated.nsec, nip05: null, nip05Verified: false, profile: null };
  }

  it("round-trips encrypted blobs", async () => {
    const identity = makeIdentity();
    const source = new Blob(["drive-secret"], { type: "text/plain" });
    const payload = await encryptDriveBlob(source, identity);
    const decrypted = await decryptDriveBlob(payload, identity);
    await expect(decrypted.text()).resolves.toBe("drive-secret");
  });

  it("rejects decryption with a different key", async () => {
    const identity = makeIdentity();
    const other = makeIdentity();
    const payload = await encryptDriveBlob(new Blob(["drive-secret"], { type: "text/plain" }), identity);
    await expect(decryptDriveBlob(payload, other)).rejects.toThrow();
  });
});
