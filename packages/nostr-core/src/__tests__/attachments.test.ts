import { describe, it, expect } from "vitest";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { nsecEncode } from "nostr-tools/nip19";
import { encryptAttachment, decryptAttachment, wrapFileKey, unwrapFileKey } from "../attachments";

describe("encryptAttachment / decryptAttachment", () => {
  it("round-trips a blob", async () => {
    const source = new Blob(["hello encrypted world"], { type: "text/plain" });
    const { ciphertext, fileKey, fileIv } = await encryptAttachment(source);
    expect(ciphertext).not.toBe(source);
    const decrypted = await decryptAttachment(await ciphertext.arrayBuffer(), fileKey, fileIv);
    await expect(decrypted.text()).resolves.toBe("hello encrypted world");
  });

  it("produces different ciphertext for same plaintext (nonce)", async () => {
    const source = new Blob(["same data"], { type: "text/plain" });
    const a = await encryptAttachment(source);
    const b = await encryptAttachment(source);
    const aBuf = await a.ciphertext.arrayBuffer();
    const bBuf = await b.ciphertext.arrayBuffer();
    expect(Buffer.from(aBuf).equals(Buffer.from(bBuf))).toBe(false);
  });

  it("rejects decryption with wrong key", async () => {
    const source = new Blob(["secret"], { type: "text/plain" });
    const { ciphertext, fileIv } = await encryptAttachment(source);
    const wrongKey = new Uint8Array(32).fill(9);
    await expect(decryptAttachment(await ciphertext.arrayBuffer(), wrongKey, fileIv)).rejects.toThrow();
  });

  it("rejects decryption with wrong IV", async () => {
    const source = new Blob(["secret"], { type: "text/plain" });
    const { ciphertext, fileKey } = await encryptAttachment(source);
    const wrongIv = new Uint8Array(12).fill(7);
    await expect(decryptAttachment(await ciphertext.arrayBuffer(), fileKey, wrongIv)).rejects.toThrow();
  });
});

describe("wrapFileKey / unwrapFileKey", () => {
  it("round-trips a file key from sender to receiver", () => {
    const senderSk = generateSecretKey();
    const receiverSk = generateSecretKey();
    const receiverPubkey = getPublicKey(receiverSk);
    const fileKey = new Uint8Array(32).fill(42);

    const wrapped = wrapFileKey(fileKey, senderSk, receiverPubkey);
    expect(wrapped).toBeTruthy();
    expect(typeof wrapped).toBe("string");

    const unwrapped = unwrapFileKey(wrapped, receiverSk, getPublicKey(senderSk));
    expect(unwrapped).toEqual(fileKey);
  });

  it("rejects unwrap with wrong receiver key", () => {
    const senderSk = generateSecretKey();
    const receiverSk = generateSecretKey();
    const eavesdropperSk = generateSecretKey();
    const receiverPubkey = getPublicKey(receiverSk);
    const fileKey = new Uint8Array(32).fill(42);

    const wrapped = wrapFileKey(fileKey, senderSk, receiverPubkey);
    expect(() => unwrapFileKey(wrapped, eavesdropperSk, getPublicKey(senderSk))).toThrow();
  });

  it("multiple recipients each get a decryptable key", () => {
    const senderSk = generateSecretKey();
    const recipients = [generateSecretKey(), generateSecretKey(), generateSecretKey()];
    const fileKey = new Uint8Array(32).fill(99);

    for (const recipientSk of recipients) {
      const recipientPubkey = getPublicKey(recipientSk);
      const wrapped = wrapFileKey(fileKey, senderSk, recipientPubkey);
      const unwrapped = unwrapFileKey(wrapped, recipientSk, getPublicKey(senderSk));
      expect(unwrapped).toEqual(fileKey);
    }
  });

  it("produces different wrapped keys for different recipients (different conversation keys)", () => {
    const senderSk = generateSecretKey();
    const recipients = [generateSecretKey(), generateSecretKey()];
    const fileKey = new Uint8Array(32).fill(77);

    const wrapped1 = wrapFileKey(fileKey, senderSk, getPublicKey(recipients[0]));
    const wrapped2 = wrapFileKey(fileKey, senderSk, getPublicKey(recipients[1]));
    expect(wrapped1).not.toBe(wrapped2);
  });
});

describe("full integration: encrypt + wrap + unwrap + decrypt", () => {
  it("simulates a sender sending an encrypted attachment to 3 recipients", async () => {
    const senderSk = generateSecretKey();
    const recipients = [generateSecretKey(), generateSecretKey(), generateSecretKey()];
    const originalContent = "Top secret document content";

    // Sender: encrypt the file
    const source = new Blob([originalContent], { type: "text/plain" });
    const { ciphertext, fileKey, fileIv } = await encryptAttachment(source);

    // Sender: wrap the file key for each recipient
    const wrappedKeys = recipients.map((r) => wrapFileKey(fileKey, senderSk, getPublicKey(r)));

    // Each recipient: unwrap and decrypt
    for (let i = 0; i < recipients.length; i++) {
      const unwrappedKey = unwrapFileKey(wrappedKeys[i], recipients[i], getPublicKey(senderSk));
      const decrypted = await decryptAttachment(await ciphertext.arrayBuffer(), unwrappedKey, fileIv);
      await expect(decrypted.text()).resolves.toBe(originalContent);
    }
  });

  it("eavesdropper cannot unwrap the key", async () => {
    const senderSk = generateSecretKey();
    const receiverSk = generateSecretKey();
    const eavesdropperSk = generateSecretKey();
    const fileKey = new Uint8Array(32).fill(55);
    const source = new Blob(["confidential"], { type: "text/plain" });
    const { ciphertext, fileIv } = await encryptAttachment(source);

    const wrapped = wrapFileKey(fileKey, senderSk, getPublicKey(receiverSk));

    // Eavesdropper tries to unwrap
    expect(() => unwrapFileKey(wrapped, eavesdropperSk, getPublicKey(senderSk))).toThrow();

    // Even if eavesdropper gets the ciphertext and fileIv, they can't decrypt without the key
    const wrongKey = new Uint8Array(32).fill(0);
    await expect(decryptAttachment(await ciphertext.arrayBuffer(), wrongKey, fileIv)).rejects.toThrow();
  });
});

describe("parseMessagePayloadAndUnwrap", () => {
  it("parses a v1 payload and unwraps attachment keys", async () => {
    const { parseMessagePayloadAndUnwrap } = await import("../messages");
    const senderSk = generateSecretKey();
    const recipientSk = generateSecretKey();
    const fileKey = new Uint8Array(32).fill(11);
    const fileIv = new Uint8Array(12).fill(22);

    const b64 = (b: Uint8Array) => {
      let s = "";
      for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return btoa(s);
    };

    const wrappedKey = wrapFileKey(fileKey, senderSk, getPublicKey(recipientSk));
    const payload = JSON.stringify({
      v: 1,
      body: "Here is the secret file",
      subject: "Re: Important",
      attachments: [{
        fileName: "secret.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1000,
        sha256: "abc123",
        url: "https://blossom.example.com/abc123",
        encryptedKey: wrappedKey,
        fileIv: b64(fileIv),
      }],
    });

    const result = parseMessagePayloadAndUnwrap(payload, recipientSk, getPublicKey(senderSk));
    expect(result.body).toBe("Here is the secret file");
    expect(result.subject).toBe("Re: Important");
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].encrypted).toBe(true);
    expect(result.attachments[0].fileIv).toBe(b64(fileIv));
    expect(result.attachments[0].fileKey).toBe(b64(fileKey));
  });

  it("returns plain text for non-JSON payloads", async () => {
    const { parseMessagePayloadAndUnwrap } = await import("../messages");
    const sk = generateSecretKey();
    const result = parseMessagePayloadAndUnwrap("Plain text message", sk, "a".repeat(64));
    expect(result.body).toBe("Plain text message");
    expect(result.subject).toBeUndefined();
    expect(result.attachments).toEqual([]);
  });
});
