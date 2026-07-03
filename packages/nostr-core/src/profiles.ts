import type { RelayPool } from "./relays";
import type { Profile, Contact } from "./types";

export async function fetchProfile(
  pool: RelayPool,
  pubkey: string
): Promise<Profile | null> {
  return new Promise((resolve) => {
    const unsub = pool.subscribe(
      [{ kinds: [0], authors: [pubkey], limit: 1 }],
      (event) => {
        try {
          const metadata = JSON.parse(event.content) as Profile;
          resolve(metadata);
        } catch {
          resolve(null);
        }
        setTimeout(unsub, 0);
      }
    );
    setTimeout(() => {
      resolve(null);
      unsub();
    }, 5000);
  });
}

export async function resolveNip05(
  nip05: string
): Promise<{ pubkey: string; verified: boolean } | null> {
  const { nip05: nip05utils } = await import("nostr-tools");
  try {
    const result = await nip05utils.queryProfile(nip05);
    if (!result) return null;
    return { pubkey: result.pubkey, verified: true };
  } catch {
    return null;
  }
}

export async function searchProfiles(
  pool: RelayPool,
  query: string
): Promise<Contact[]> {
  return new Promise((resolve) => {
    const results: Contact[] = [];
    const unsub = pool.subscribe(
      [{ kinds: [0], search: query, limit: 20 }],
      (event) => {
        try {
          const metadata = JSON.parse(event.content);
          results.push({
            pubkey: event.pubkey,
            npub: "",
            name: metadata.name || metadata.displayName || "",
            about: metadata.about || "",
            picture: metadata.picture || "",
            nip05: metadata.nip05 || "",
            nip05Verified: false,
            lastMessageAt: 0,
            relayRecommended: "",
          });
        } catch { /* skip */ }
      }
    );
    setTimeout(() => {
      resolve(results);
      unsub();
    }, 3000);
  });
}

export async function batchFetchProfiles(
  pool: RelayPool,
  pubkeys: string[]
): Promise<Map<string, Profile>> {
  return new Promise((resolve) => {
    const map = new Map<string, Profile>();
    const unsub = pool.subscribe(
      [{ kinds: [0], authors: pubkeys, limit: pubkeys.length }],
      (event) => {
        try {
          const metadata = JSON.parse(event.content) as Profile;
          map.set(event.pubkey, metadata);
        } catch { /* skip */ }
      }
    );
    setTimeout(() => {
      resolve(map);
      unsub();
    }, 5000);
  });
}
