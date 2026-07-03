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

  it("searchMessages returns all messages when query is empty", async () => {
    const { searchMessages } = await import("@/lib/sync");
    const result = searchMessages("");
    expect(Array.isArray(result)).toBe(true);
  });

  it("searchMessages filters by subject", async () => {
    const { searchMessages } = await import("@/lib/sync");
    const { useMessagesStore } = await import("@/lib/stores/messages");

    useMessagesStore.getState().ingestFromRelay({
      id: "msg1", kind: 14, pubkey: "x", recipientPubkey: "y", content: "hello", raw: "",
      createdAt: Date.now(), tags: [], subject: "Important meeting", preview: "hello",
      read: false, starred: false, archived: false, snoozedUntil: null, spam: false,
      mailbox: "inbox", labelIds: [], replyTo: null, relayUrls: [],
      attachments: [], isEncrypted: true, isGiftWrapped: false, deliveryStatus: "delivered",
    });

    const result = searchMessages("Important");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("msg1");
  });

  it("searchMessages returns empty for no match", async () => {
    const { searchMessages } = await import("@/lib/sync");
    const result = searchMessages("nonexistent");
    expect(result.length).toBe(0);
  });

  it("getMailboxMessages filters inbox messages", async () => {
    const { getMailboxMessages } = await import("@/lib/sync");
    const { useMessagesStore } = await import("@/lib/stores/messages");

    useMessagesStore.getState().ingestFromRelay({
      id: "inbox-msg", kind: 14, pubkey: "x", recipientPubkey: "y", content: "hello", raw: "",
      createdAt: Date.now(), tags: [], subject: "Test", preview: "hello",
      read: false, starred: false, archived: false, snoozedUntil: null, spam: false,
      mailbox: "inbox", labelIds: [], replyTo: null, relayUrls: [],
      attachments: [], isEncrypted: true, isGiftWrapped: false, deliveryStatus: "delivered",
    });

    const inbox = getMailboxMessages("inbox");
    expect(inbox.length).toBe(1);

    const archive = getMailboxMessages("archive");
    expect(archive.length).toBe(0);
  });
});
