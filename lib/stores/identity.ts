import { create } from "zustand";
import { createKeyStore, generateKey, importFromNsec } from "@post/nostr-core";
import type { Identity } from "@/lib/types";

interface IdentityState {
  identity: Identity | null;
  keyStore: ReturnType<typeof createKeyStore> | null;
  createOrImport: (nsec?: string) => Promise<Identity>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  identity: null,
  keyStore: null,

  async createOrImport(nsec?: string): Promise<Identity> {
    const keyStore = createKeyStore();

    let keys: { npub: string; pubkey: string; nsec?: string };

    if (nsec) {
      const result = importFromNsec(nsec);
      if (result instanceof Error) throw result;
      keys = { ...result, nsec };
    } else {
      const generated = generateKey();
      keys = generated;
    }

    const identity: Identity = {
      npub: keys.npub,
      nsec: keys.nsec ?? null,
      pubkey: keys.pubkey,
      nip05: null,
      nip05Verified: false,
      profile: null,
    };

    keyStore.save(identity);
    set({ identity, keyStore });
    return identity;
  },

  logout: () => {
    const { keyStore } = get();
    keyStore?.clear();
    set({ identity: null, keyStore: null });
  },

  async refreshProfile() {
    // Will be implemented in P2 when relay pool is available
  },
}));
