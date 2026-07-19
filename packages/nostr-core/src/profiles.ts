import type { RelayPool } from "./relays";
import type { Profile, Contact } from "./types";
import { subscribeSingle, subscribeAccumulate } from "./utils/timeout";

export async function fetchProfile(
  pool: RelayPool,
  pubkey: string
): Promise<Profile | null> {
  return subscribeSingle(
    pool,
    [{ kinds: [0], authors: [pubkey], limit: 1 }],
    (event) => {
      try {
        return JSON.parse(event.content) as Profile;
      } catch {
        return null;
      }
    },
    5000
  );
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
  return subscribeAccumulate<Contact>(
    pool,
    [{ kinds: [0], search: query, limit: 20 }],
    (event, acc) => {
      try {
        const metadata = JSON.parse(event.content);
        acc.push({
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
    },
    3000
  );
}

export async function fetchContactList(
  pool: RelayPool,
  pubkey: string
): Promise<string[]> {
  return subscribeSingle(
    pool,
    [{ kinds: [3], authors: [pubkey], limit: 1 }],
    (event) => {
      const pubkeys: string[] = [];
      for (const tag of event.tags) {
        if (tag[0] === "p" && tag[1]) {
          pubkeys.push(tag[1]);
        }
      }
      return pubkeys;
    },
    5000
  ).then((r) => r ?? []);
}

export async function batchFetchProfiles(
  pool: RelayPool,
  pubkeys: string[]
): Promise<Map<string, Profile>> {
  const entries = await subscribeAccumulate<{ pubkey: string; profile: Profile }>(
    pool,
    [{ kinds: [0], authors: pubkeys, limit: pubkeys.length }],
    (event, acc) => {
      try {
        const metadata = JSON.parse(event.content) as Profile;
        acc.push({ pubkey: event.pubkey, profile: metadata });
      } catch { /* skip */ }
    },
    5000
  );
  const map = new Map<string, Profile>();
  for (const { pubkey, profile } of entries) {
    map.set(pubkey, profile);
  }
  return map;
}
