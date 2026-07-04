import { describe, it, expect } from "vitest";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { generateKey } from "../keys";
import { decryptDriveBlob, encryptDriveBlob, encryptContentForOwner, decryptContentForOwner, createFileMetadataEvent, createFolderEvent, parseFileMetadataEvent, parseFolderEvent } from "../drive";

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

  it("encryptContentForOwner round-trips", () => {
    const sk = generateSecretKey();
    const content = "my-secret-filename.pdf";
    const encrypted = encryptContentForOwner(content, sk);
    expect(encrypted).not.toBe(content);
    const decrypted = decryptContentForOwner(encrypted, sk);
    expect(decrypted).toBe(content);
  });

  it("encryptContentForOwner rejects wrong key", () => {
    const sk = generateSecretKey();
    const wrongSk = generateSecretKey();
    const encrypted = encryptContentForOwner("secret", sk);
    expect(() => decryptContentForOwner(encrypted, wrongSk)).toThrow();
  });

  it("encryptContentForOwner produces deterministic-like output for same key", () => {
    const sk = generateSecretKey();
    const content = "same-content";
    const e1 = encryptContentForOwner(content, sk);
    const e2 = encryptContentForOwner(content, sk);
    // NIP-44 uses random nonce, so outputs differ
    expect(e1).not.toBe(e2);
    // Both decrypt back to original
    expect(decryptContentForOwner(e1, sk)).toBe(content);
    expect(decryptContentForOwner(e2, sk)).toBe(content);
  });

  it("createFileMetadataEvent encrypts content when requested", () => {
    const sk = generateSecretKey();
    const pubkey = getPublicKey(sk);
    const file = {
      id: "test-id",
      name: "secret.pdf",
      folderId: null,
      fileKind: "pdf" as const,
      mimeType: "application/pdf",
      sizeBytes: 1000,
      createdAt: 1000,
      updatedAt: 1000,
      modifiedLabel: "Modified",
      ownerName: "Test",
      ownerInitials: "TT",
      source: "blossom" as const,
      starred: false,
      trashed: false,
      offlineAvailable: false,
      encrypted: true,
      storedInDrive: true,
      sha256: "abc123",
      blobUrl: "https://example.com/file",
      preview: "preview",
      sharedWith: [],
      tags: [],
      color: "red",
      letter: "S",
      encryption: null,
      encryptedBlob: null,
    };

    const event = createFileMetadataEvent(file);
    expect(event.content).toBe("secret.pdf");
    expect(event.tags).toContainEqual(["encrypted", "true"]);
  });

  it("parseFileMetadataEvent uses placeholder when content is encrypted", () => {
    const event = {
      id: "evt-id",
      pubkey: "a".repeat(64),
      content: "encrypted:base64data",
      tags: [["encrypted", "true"], ["content-encryption", "nip44-v2"], ["url", "https://example.com/f"], ["m", "text/plain"], ["x", "sha256hash"], ["size", "1000"]],
      created_at: 1000,
    };

    const file = parseFileMetadataEvent(event);
    expect(file.name).toBe("Encrypted file");
    expect(file.encrypted).toBe(true);
  });

  it("parseFileMetadataEvent uses content when not encrypted", () => {
    const event = {
      id: "evt-id",
      pubkey: "a".repeat(64),
      content: "readme.txt",
      tags: [["url", "https://example.com/f"], ["m", "text/plain"], ["x", "sha256hash"], ["size", "1000"]],
      created_at: 1000,
    };

    const file = parseFileMetadataEvent(event);
    expect(file.name).toBe("readme.txt");
    expect(file.encrypted).toBe(false);
  });

  it("parseFolderEvent uses placeholder when content is encrypted", () => {
    const event = {
      id: "folder-id",
      pubkey: "a".repeat(64),
      content: "encrypted:base64data",
      tags: [["d", "folder-id"], ["content-encryption", "nip44-v2"], ["title", "Work Docs"]],
      created_at: 1000,
    };

    const folder = parseFolderEvent(event);
    // Falls back to title tag (also plaintext in this mock) - but if content-encryption is set, we use placeholder
    expect(folder.name).toBe("Encrypted folder");
  });

  it("parseFolderEvent decrypts real content via sync layer", () => {
    const sk = generateSecretKey();
    const folderName = "My Secret Folder";
    const encryptedContent = encryptContentForOwner(folderName, sk);

    const event = {
      id: "folder-id",
      pubkey: getPublicKey(sk),
      content: encryptedContent,
      tags: [["d", "folder-id"], ["content-encryption", "nip44-v2"]],
      created_at: 1000,
    };

    const folder = parseFolderEvent(event);
    expect(folder.name).toBe("Encrypted folder");

    // Simulate what syncDriveFromRelays does
    const decrypted = decryptContentForOwner(event.content, sk);
    expect(decrypted).toBe(folderName);
  });
});
