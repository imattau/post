import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMessagesStore } from "@/lib/stores/messages";

vi.mock("@/lib/db/schema", () => ({
  db: {
    messages: {
      orderBy: vi.fn(() => ({ reverse: vi.fn(() => ({ toArray: vi.fn(async () => []), first: vi.fn() })) })),
      put: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({ count: vi.fn(async () => 0), equals: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })),
    },
  },
}));

const mockSubscribe = vi.fn(() => vi.fn());

vi.mock("@post/nostr-core", async () => {
  const actual = await vi.importActual("@post/nostr-core") as object;
  return {
    ...actual,
    decryptEvent: vi.fn(async () => "decrypted content"),
    createKeyStore: vi.fn(() => ({
      load: vi.fn(() => ({ npub: "npub1test", nsec: "nsec1test", pubkey: "a".repeat(64), nip05: null, nip05Verified: false, profile: null })),
      save: vi.fn(),
      clear: vi.fn(),
    })),
  };
});

vi.mock("@/lib/stores/relays", () => ({
  useRelaysStore: {
    getState: vi.fn(() => ({
      pool: {
        subscribe: mockSubscribe,
        publish: vi.fn(),
        connectAll: vi.fn(),
        disconnectAll: vi.fn(),
        getStatus: vi.fn(),
        getHealthPercent: vi.fn(),
        getSyncedAgo: vi.fn(),
      },
    })),
  },
}));

describe("sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useMessagesStore.setState({ byId: {}, ids: [] });
  });

  it("loadCachedMessages returns early when no messages", async () => {
    const { loadCachedMessages } = await import("@/lib/sync");
    await expect(loadCachedMessages()).resolves.not.toThrow();
  });
});
