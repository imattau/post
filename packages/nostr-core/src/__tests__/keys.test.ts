import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateKey, importFromNsec, importFromNpub, formatNpub, createKeyStore } from "../keys";

describe("generateKey", () => {
  it("returns nsec, npub, and pubkey", () => {
    const result = generateKey();
    expect(result).toHaveProperty("nsec");
    expect(result).toHaveProperty("npub");
    expect(result).toHaveProperty("pubkey");
  });

  it("nsec starts with nsec1", () => {
    const result = generateKey();
    expect(result.nsec).toMatch(/^nsec1/);
  });

  it("npub starts with npub1", () => {
    const result = generateKey();
    expect(result.npub).toMatch(/^npub1/);
  });

  it("pubkey is 64-char hex", () => {
    const result = generateKey();
    expect(result.pubkey).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different keys on each call", () => {
    const a = generateKey();
    const b = generateKey();
    expect(a.nsec).not.toBe(b.nsec);
    expect(a.pubkey).not.toBe(b.pubkey);
  });
});

describe("importFromNsec", () => {
  it("returns npub and pubkey for a valid nsec", () => {
    const generated = generateKey();
    const result = importFromNsec(generated.nsec);
    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;
    expect(result.npub).toBe(generated.npub);
    expect(result.pubkey).toBe(generated.pubkey);
  });

  it("returns Error for invalid nsec", () => {
    const result = importFromNsec("nsec1invalid");
    expect(result).toBeInstanceOf(Error);
  });

  it("returns Error for empty string", () => {
    const result = importFromNsec("");
    expect(result).toBeInstanceOf(Error);
  });

  it("returns Error for npub passed as nsec", () => {
    const result = importFromNsec("npub1hello");
    expect(result).toBeInstanceOf(Error);
  });
});

describe("importFromNpub", () => {
  it("returns pubkey for a valid npub", () => {
    const generated = generateKey();
    const result = importFromNpub(generated.npub);
    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;
    expect(result.pubkey).toBe(generated.pubkey);
  });

  it("returns Error for invalid npub", () => {
    const result = importFromNpub("npub1invalid");
    expect(result).toBeInstanceOf(Error);
  });

  it("returns Error for empty string", () => {
    const result = importFromNpub("");
    expect(result).toBeInstanceOf(Error);
  });
});

describe("formatNpub", () => {
  it("truncates npub with first 10 chars + … + last 4 hex chars", () => {
    const { npub, pubkey } = generateKey();
    const result = formatNpub(npub);
    expect(result).toMatch(new RegExp(`^${npub.slice(0, 10)}…${pubkey.slice(-4)}$`));
  });

  it("returns the input unchanged if invalid", () => {
    const result = formatNpub("not-an-npub");
    expect(result).toBe("not-an-npub");
  });
});

describe("KeyStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("load returns null when no identity stored", () => {
    const store = createKeyStore();
    expect(store.load()).toBeNull();
  });

  it("save persists identity to localStorage", () => {
    const store = createKeyStore();
    const identity = {
      npub: "npub1test",
      nsec: "nsec1test",
      pubkey: "a".repeat(64),
      nip05: null,
      nip05Verified: false,
      profile: null,
    };
    store.save(identity);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "nostr-identity",
      JSON.stringify(identity)
    );
  });

  it("load retrieves saved identity", () => {
    const store = createKeyStore();
    const identity = {
      npub: "npub1test",
      nsec: null,
      pubkey: "b".repeat(64),
      nip05: "user@example.com",
      nip05Verified: true,
      profile: null,
    };
    store.save(identity);
    const loaded = store.load();
    expect(loaded).toEqual(identity);
  });

  it("clear removes identity from storage and cache", () => {
    const store = createKeyStore();
    store.save({
      npub: "npub1test",
      nsec: null,
      pubkey: "c".repeat(64),
      nip05: null,
      nip05Verified: false,
      profile: null,
    });
    store.clear();
    expect(store.load()).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith("nostr-identity");
  });
});
