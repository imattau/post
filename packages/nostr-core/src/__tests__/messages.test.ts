import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { nsecEncode } from "nostr-tools/nip19";
import { sendMessage, decryptEvent } from "../messages";
import { nip44 } from "nostr-tools";

function makeKeys(sk: Uint8Array) {
  const pubkey = getPublicKey(sk);
  return {
    load: vi.fn(() => ({
      npub: "npub1test",
      nsec: nsecEncode(sk),
      pubkey,
      nip05: null as string | null,
      nip05Verified: false,
      profile: null,
    })),
    save: vi.fn(),
    clear: vi.fn(),
  };
}

const mockPublish = vi.fn(async () => new Map([["wss://relay.damus.io", true], ["wss://nos.lol", true]]));

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

  it("throws when keys.load returns null", async () => {
    const keys = makeKeys(generateSecretKey());
    (keys.load as any).mockReturnValueOnce(null);
    await expect(sendMessage(mockPool, keys, { to: "b".repeat(64), content: "Hello" })).rejects.toThrow("Cannot send message");
  });

  it("round-trips NIP-44 encryption between sender and receiver", async () => {
    const senderSk = generateSecretKey();
    const receiverSk = generateSecretKey();
    const senderPubkey = getPublicKey(senderSk);
    const receiverPubkey = getPublicKey(receiverSk);
    const message = "Secret direct message content";

    const senderConversationKey = nip44.v2.utils.getConversationKey(senderSk, receiverPubkey);
    const ciphertext = nip44.v2.encrypt(message, senderConversationKey);
    expect(ciphertext).not.toBe(message);

    const receiverConversationKey = nip44.v2.utils.getConversationKey(receiverSk, senderPubkey);
    const decrypted = nip44.v2.decrypt(ciphertext, receiverConversationKey);
    expect(decrypted).toBe(message);
  });

  it("rejects NIP-44 decryption with wrong key", async () => {
    const senderSk = generateSecretKey();
    const receiverSk = generateSecretKey();
    const eavesdropperSk = generateSecretKey();
    const receiverPubkey = getPublicKey(receiverSk);

    const sk = nip44.v2.utils.getConversationKey(senderSk, receiverPubkey);
    const ciphertext = nip44.v2.encrypt("secret", sk);

    const eavesdropperKey = nip44.v2.utils.getConversationKey(eavesdropperSk, receiverPubkey);
    expect(() => nip44.v2.decrypt(ciphertext, eavesdropperKey)).toThrow();
  });

  it("NIP-44 encrypted format changes each time (nonce)", async () => {
    const sk = generateSecretKey();
    const recipient = getPublicKey(generateSecretKey());
    const conversationKey = nip44.v2.utils.getConversationKey(sk, recipient);
    const content = "same message";

    const e1 = nip44.v2.encrypt(content, conversationKey);
    const e2 = nip44.v2.encrypt(content, conversationKey);
    expect(e1).not.toBe(e2);
    expect(nip44.v2.decrypt(e1, conversationKey)).toBe(content);
    expect(nip44.v2.decrypt(e2, conversationKey)).toBe(content);
  });

  it("sendMessage produces a published event with valid id", async () => {
    const sk = generateSecretKey();
    const keys = makeKeys(sk);
    const recipient = getPublicKey(generateSecretKey());

    const result = await sendMessage(mockPool, keys, {
      to: recipient,
      content: "Hello via sendMessage",
    });

    expect(result.eventId).toBeTruthy();
    expect(result.delivered).toBe(2);
  });
});

describe("decryptEvent", () => {
  it("decrypts a real NIP-44 encrypted event", async () => {
    const sk = generateSecretKey();
    const senderSk = generateSecretKey();
    const senderPubkey = getPublicKey(senderSk);
    const keys = makeKeys(sk);

    const conversationKey = nip44.v2.utils.getConversationKey(sk, senderPubkey);
    const encrypted = nip44.v2.encrypt("real decrypted content", conversationKey);

    const event = {
      id: "event-id",
      kind: 14,
      pubkey: senderPubkey,
      content: encrypted,
      tags: [["p", getPublicKey(sk)]],
      created_at: Math.floor(Date.now() / 1000),
      sig: "x".repeat(128),
    };

    const decrypted = await decryptEvent(event, keys);
    expect(decrypted).toBe("real decrypted content");
  });

  it("throws on event encrypted for a different key", async () => {
    const sk = generateSecretKey();
    const otherSk = generateSecretKey();
    const senderSk = generateSecretKey();
    const senderPubkey = getPublicKey(senderSk);
    const keys = makeKeys(sk);

    const conversationKey = nip44.v2.utils.getConversationKey(otherSk, senderPubkey);
    const encrypted = nip44.v2.encrypt("secret", conversationKey);

    const event = {
      id: "event-id",
      kind: 14,
      pubkey: senderPubkey,
      content: encrypted,
      tags: [["p", getPublicKey(sk)]],
      created_at: Math.floor(Date.now() / 1000),
      sig: "x".repeat(128),
    };

    await expect(decryptEvent(event, keys)).rejects.toThrow();
  });
});

describe("gift-wrap (NIP-59)", () => {
  it("round-trips content through wrapEvent and unwrapEvent", async () => {
    const sk = generateSecretKey();
    const recipientSk = generateSecretKey();
    const recipientPubkey = getPublicKey(recipientSk);
    const content = "Secret gift-wrapped message";

    const { nip17 } = await import("nostr-tools");

    const wrapped = nip17.wrapEvent(sk, { publicKey: recipientPubkey }, content);
    expect(wrapped.content).toBeTruthy();

    const unwrapped = nip17.unwrapEvent(wrapped, recipientSk) as unknown as { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] };
    expect(unwrapped.content).toBe(content);
    expect(unwrapped.pubkey).toBe(getPublicKey(sk));
  });

  it("rejects unwrap with wrong key", async () => {
    const sk = generateSecretKey();
    const wrongSk = generateSecretKey();
    const recipientPubkey = getPublicKey(generateSecretKey());
    const { nip17 } = await import("nostr-tools");

    const wrapped = nip17.wrapEvent(sk, { publicKey: recipientPubkey }, "secret");

    expect(() => nip17.unwrapEvent(wrapped, wrongSk)).toThrow();
  });
});
