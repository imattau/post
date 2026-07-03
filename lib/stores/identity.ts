import { create } from "zustand";
import { createKeyStore, generateKey, importFromNsec } from "@post/nostr-core";
import { getPublicKey } from "nostr-tools/pure";
import type { Identity } from "@/lib/types";
import { isTauri, createTauriKeyStore } from "@/lib/tauri";

export interface Nip07 {
  getPublicKey(): Promise<string>;
  signEvent(event: { kind: number; tags: string[][]; content: string; created_at: number }): Promise<{ sig: string }>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
}

declare global {
  interface Window {
    nostr?: Nip07;
  }
}

interface IdentityState {
  identity: Identity | null;
  keyStore: ReturnType<typeof createKeyStore> | null;
  usingNip07: boolean;
  nip07Available: boolean;
  createOrImport: (nsec?: string) => Promise<Identity>;
  connectNip07: () => Promise<Identity>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  getSigner: () => ((t: { kind: number; tags: string[][]; content: string; created_at: number }) => Promise<{ sig: string }>) | null;
}

function getKeyStore() {
  return isTauri() ? createTauriKeyStore() : createKeyStore();
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  identity: null,
  keyStore: null,
  usingNip07: false,
  nip07Available: typeof window !== "undefined" && !!window.nostr,

  async createOrImport(nsec?: string): Promise<Identity> {
    const keyStore = getKeyStore();

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
    set({ identity, keyStore, usingNip07: false });
    return identity;
  },

  async connectNip07(): Promise<Identity> {
    if (!window.nostr) throw new Error("NIP-07 extension not available");

    const pubkey = await window.nostr.getPublicKey();
    const { npubEncode } = await import("nostr-tools/nip19");
    const npub = npubEncode(pubkey);

    const identity: Identity = {
      npub,
      nsec: null,
      pubkey,
      nip05: null,
      nip05Verified: false,
      profile: null,
    };

    const keyStore = createKeyStore();
    keyStore.save(identity);
    set({ identity, keyStore, usingNip07: true });
    return identity;
  },

  logout: () => {
    const { keyStore } = get();
    keyStore?.clear();
    set({ identity: null, keyStore: null, usingNip07: false });
  },

  async refreshProfile() {},

  getSigner: () => {
    const { usingNip07, identity } = get();
    if (usingNip07 && window.nostr) {
      return (t) => window.nostr!.signEvent(t).then((s) => ({ ...t, ...s, id: "", pubkey: identity?.pubkey ?? "" }) as any);
    }
    return null;
  },
}));
