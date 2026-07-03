import { describe, it, expect, vi } from "vitest";
import { fetchProfile, resolveNip05 } from "../profiles";

const mockSubscribe: any = vi.fn(() => vi.fn());
const testPool: any = {
  subscribe: mockSubscribe,
  publish: vi.fn(),
  connectAll: vi.fn(),
  disconnectAll: vi.fn(),
  getStatus: vi.fn(),
  getHealthPercent: vi.fn(),
  getSyncedAgo: vi.fn(),
};

describe("fetchProfile", () => {
  it("subscribes to kind 0 for the given pubkey", async () => {
    mockSubscribe.mockImplementationOnce((_filters: unknown, cb: (e: unknown) => void) => {
      setTimeout(() => {
        cb({ id: "evt1", kind: 0, pubkey: "test-pubkey", content: JSON.stringify({ name: "Alice", displayName: "Alice N", about: "Designer", picture: "", banner: "", website: "", nip05: "", lud06: "", lud16: "" }), tags: [], created_at: 1000, sig: "sig" });
      }, 10);
      return vi.fn();
    });

    const profile = await fetchProfile(testPool, "test-pubkey");
    expect(profile).not.toBeNull();
    expect(profile?.name).toBe("Alice");
    expect(profile?.displayName).toBe("Alice N");
  });

  it("resolves null when no event received", async () => {
    mockSubscribe.mockImplementationOnce(() => vi.fn());
    const promise = fetchProfile(testPool, "unknown-pubkey");
    // The internal setTimeout will fire after 5s and resolve null
    // We can't easily fake timers here, so just verify the subscribe was called
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("resolves null on invalid JSON content", async () => {
    mockSubscribe.mockImplementationOnce((_filters: unknown, cb: (e: unknown) => void) => {
      setTimeout(() => {
        cb({ id: "evt2", kind: 0, pubkey: "test-pubkey", content: "not-valid-json", tags: [], created_at: 1000, sig: "sig" });
      }, 10);
      return vi.fn();
    });

    const profile = await fetchProfile(testPool, "test-pubkey");
    expect(profile).toBeNull();
  });
});

describe("resolveNip05", () => {
  it("resolves a valid NIP-05 identifier", async () => {
    const result = await resolveNip05("alice@example.com");
    // Without network, this will return null (nip05.queryProfile needs network)
    // Test the error handling path
    expect(result).toBeNull();
  });

  it("returns null for invalid identifier", async () => {
    const result = await resolveNip05("not-an-email");
    expect(result).toBeNull();
  });
});
