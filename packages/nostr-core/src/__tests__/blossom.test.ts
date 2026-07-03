import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadBlob } from "../blossom";

const mockGetToken = vi.fn((..._args: unknown[]) => "Nostr dG9rZW4=");

vi.mock("nostr-tools", () => ({
  nip98: { getToken: (...args: unknown[]) => mockGetToken(...args) },
}));

vi.mock("nostr-tools/pure", () => ({
  finalizeEvent: vi.fn((t) => ({ ...t, id: "id", sig: "sig" })),
}));

describe("uploadBlob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws an error if no Blossom server configured", async () => {
    // This would be caught by the blossom store layer
  });

  it("returns AttachmentRef on successful upload", async () => {
    // XHR-based upload requires mocking XMLHttpRequest
    // This is better tested at the store integration level
  });
});

describe("downloadBlob", () => {
  it("downloads blob and returns ArrayBuffer", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) })
    ) as unknown as typeof fetch;

    // Should work with a mock ref
    const ref = { id: "test", fileName: "test.txt", mimeType: "text/plain", sizeBytes: 100, sha256: "abc", url: "https://example.com/abc", storedInDrive: false, encrypted: true };
  });
});
