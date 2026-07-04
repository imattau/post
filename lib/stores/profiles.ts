import { create } from "zustand";
import type { Profile } from "@post/nostr-core";

interface ProfilesState {
  byPubkey: Record<string, Profile>;
  fetchProfile: (pubkey: string) => Promise<Profile | null>;
  batchFetchProfiles: (pubkeys: string[]) => Promise<void>;
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  byPubkey: {},

  async fetchProfile(pubkey: string) {
    const cached = get().byPubkey[pubkey];
    if (cached) return cached;

    const { useRelaysStore } = await import("@/lib/stores/relays");
    const pool = useRelaysStore.getState().pool;
    if (!pool) return null;

    const { fetchProfile } = await import("@post/nostr-core");
    const profile = await fetchProfile(pool, pubkey);
    if (profile) {
      set((state) => ({ byPubkey: { ...state.byPubkey, [pubkey]: profile } }));
    }
    return profile;
  },

  async batchFetchProfiles(pubkeys: string[]) {
    const { useRelaysStore } = await import("@/lib/stores/relays");
    const pool = useRelaysStore.getState().pool;
    if (!pool) return;

    const uncached = pubkeys.filter((pk) => !get().byPubkey[pk]);
    if (uncached.length === 0) return;

    const { batchFetchProfiles } = await import("@post/nostr-core");
    const resolved = await batchFetchProfiles(pool, uncached);
    if (resolved.size > 0) {
      set((state) => ({
        byPubkey: { ...state.byPubkey, ...Object.fromEntries(resolved) },
      }));
    }
  },
}));
