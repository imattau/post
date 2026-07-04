import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessage } from "../messages";

const mockWrapEvent = vi.fn((..._args: unknown[]) => ({ id: "wrapped-id", kind: 14, pubkey: "x", content: "encrypted", tags: [], created_at: 0, sig: "y" }));
const mockPublish = vi.fn(async () => new Map([["wss://relay.damus.io", true], ["wss://nos.lol", true]]));

const mockFinalizeEvent = vi.fn((event: any, _sk: Uint8Array) => ({
  ...event,
  id: "finalized-id",
  pubkey: "a".repeat(64),
  sig: "s".repeat(128),
}));

vi.mock("nostr-tools", () => ({
  nip44: { v2: { utils: { getConversationKey: vi.fn(() => new Uint8Array(32)) }, encrypt: vi.fn(() => "encrypted"), decrypt: vi.fn(() => "decrypted") } },
  nip17: { wrapEvent: (...args: unknown[]) => mockWrapEvent(...args) },
  nip59: {},
  finalizeEvent: (...args: unknown[]) => (mockFinalizeEvent as any)(...args),
}));

const validIdentity = {
  npub: "npub1test",
  nsec: "nsec1test",
  pubkey: "a".repeat(64),
  nip05: null,
  nip05Verified: false,
  profile: null,
};

vi.mock("nostr-tools/nip19", () => ({
  decode: vi.fn(() => ({ type: "nsec", data: new Uint8Array(32) })),
}));

describe("sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPool: any = {
    publish: mockPublish,
    subscribe: vi.fn(() => vi.fn()),
    connectAll: vi.fn(),
    disconnectAll: vi.fn(),
    getStatus: vi.fn(),
    getHealthPercent: vi.fn(),
    getSyncedAgo: vi.fn(),
  };

  const mockKeys: any = {
    load: vi.fn(() => ({
      npub: "npub1test",
      nsec: "nsec1test",
      pubkey: "a".repeat(64),
      nip05: null,
      nip05Verified: false,
      profile: null,
    })),
    save: vi.fn(),
    clear: vi.fn(),
  };

  it("returns SendResult with eventId and published map", async () => {
    const result = await sendMessage(mockPool, mockKeys, { to: "b".repeat(64), content: "Hello" });
    expect(result).toHaveProperty("eventId");
    expect(result).toHaveProperty("published");
    expect(result).toHaveProperty("delivered");
  });

  it("delivered count matches successful publishes", async () => {
    const result = await sendMessage(mockPool, mockKeys, { to: "b".repeat(64), content: "Hello" });
    expect(result.delivered).toBe(2);
  });

  it("throws when keys.load returns null", async () => {
    mockKeys.load.mockReturnValueOnce(null);
    await expect(sendMessage(mockPool, mockKeys, { to: "b".repeat(64), content: "Hello" })).rejects.toThrow("No private key");
  });

  it("throws when identity has no nsec", async () => {
    mockKeys.load.mockReturnValueOnce({
      npub: "npub1test",
      nsec: null,
      pubkey: "a".repeat(64),
      nip05: null,
      nip05Verified: false,
      profile: null,
    });
    await expect(sendMessage(mockPool, mockKeys, { to: "b".repeat(64), content: "Hello" })).rejects.toThrow("No private key");
  });

  it("passes subject to wrapEvent when giftWrap is true", async () => {
    await sendMessage(mockPool, mockKeys, { to: "b".repeat(64), content: "Body", subject: "Subject", giftWrap: true });
    expect(mockWrapEvent).toHaveBeenCalled();
  });

  it("uses finalizeEvent when giftWrap is false", async () => {
    await sendMessage(mockPool, mockKeys, { to: "b".repeat(64), content: "Body", subject: "Subject" });
    expect(mockFinalizeEvent).toHaveBeenCalled();
    const event = mockFinalizeEvent.mock.calls[0][0];
    expect(event.kind).toBe(14);
    expect(event.tags[0]).toEqual(["p", "b".repeat(64)]);
    expect(event.tags[1]).toEqual(["subject", "Subject"]);
  });
});
