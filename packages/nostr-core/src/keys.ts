import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { nsecEncode, npubEncode, decode } from "nostr-tools/nip19";
import type { Identity } from "./types";

export function generateKey(): { nsec: string; npub: string; pubkey: string } {
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  return {
    nsec: nsecEncode(sk),
    npub: npubEncode(pubkey),
    pubkey,
  };
}

export function importFromNsec(nsec: string): { npub: string; pubkey: string } | Error {
  try {
    const decoded = decode(nsec);
    if (decoded.type !== "nsec") return new Error("Invalid nsec");
    const sk = decoded.data;
    const pubkey = getPublicKey(sk);
    return {
      npub: npubEncode(pubkey),
      pubkey,
    };
  } catch {
    return new Error("Invalid nsec");
  }
}

export function importFromNpub(npub: string): { pubkey: string } | Error {
  try {
    const decoded = decode(npub);
    if (decoded.type !== "npub") return new Error("Invalid npub");
    return { pubkey: decoded.data };
  } catch {
    return new Error("Invalid npub");
  }
}

export function formatNpub(npub: string): string {
  try {
    const decoded = decode(npub);
    if (decoded.type !== "npub") return npub;
    const prefix = npub.slice(0, 10);
    const suffix = npub.slice(-4);
    return `${prefix}…${suffix}`;
  } catch {
    return npub;
  }
}

export interface KeyStore {
  load(): Identity | null;
  save(identity: Identity): void;
  clear(): void;
}

const SESSION_KEY = "nostr-identity";

export function createKeyStore(): KeyStore {
  let cached: Identity | null = null;

  return {
    load(): Identity | null {
      if (cached) return cached;
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        cached = JSON.parse(raw) as Identity;
        return cached;
      } catch {
        return null;
      }
    },
    save(identity: Identity): void {
      cached = identity;
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(identity));
      } catch { /* quota exceeded — ignore */ }
    },
    clear(): void {
      cached = null;
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch { /* ignore */ }
    },
  };
}
