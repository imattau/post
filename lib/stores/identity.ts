"use client";

import { create } from "zustand";
import { createKeyStore, generateKey, importFromNsec } from "@post/nostr-core";
import { getPublicKey, finalizeEvent } from "nostr-tools/pure";
import { npubEncode } from "nostr-tools/nip19";
import type { Identity } from "@/lib/types";
import { isTauri, createTauriKeyStore } from "@/lib/tauri";

export interface Nip07Signer {
  getPublicKey(): Promise<string>;
  signEvent(event: { kind: number; tags: string[][]; content: string; created_at: number }): Promise<{ sig: string }>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
}

export interface PasskeySignerWrapper {
  getPublicKey(): string;
  signEvent(e: any): Promise<{ sig: string }>;
  destroy(): void;
}

declare global {
  interface Window {
    nostr?: Nip07Signer;
  }
}

interface IdentityState {
  identity: Identity | null;
  keyStore: ReturnType<typeof createKeyStore> | null;
  usingNip07: boolean;
  usingPasskey: boolean;
  nip07Available: boolean;
  isNewUser: boolean;
  passkeySigner: PasskeySignerWrapper | null;
  setIdentity: (identity: Identity) => void;
  createOrImport: (nsec?: string) => Promise<Identity>;
  connectNip07: () => Promise<Identity>;
  createPasskeyIdentity: () => Promise<Identity>;
  unlockPasskeyIdentity: () => Promise<Identity>;
  connectNip46: (uri: string) => Promise<Identity>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  publishProfile: (profile: { displayName: string; username: string; about: string; picture?: string }) => Promise<void>;
  getSigner: () => Nip07Signer | null;
}

function getKeyStore() {
  return isTauri() ? createTauriKeyStore() : createKeyStore();
}

const PASSKEY_RECORD_KEY = "nostr-passkey-record";

export const useIdentityStore = create<IdentityState>((set, get) => ({
  identity: null,
  keyStore: null,
  usingNip07: false,
  usingPasskey: false,
  nip07Available: typeof window !== "undefined" && !!window.nostr,
  isNewUser: false,
  passkeySigner: null,

  setIdentity(identity: Identity) {
    const keyStore = getKeyStore();
    keyStore.save(identity);
    set({ identity, keyStore, isNewUser: false });
  },

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
    set({ identity, keyStore, usingNip07: false, usingPasskey: false, passkeySigner: null, isNewUser: !nsec });
    return identity;
  },

  async connectNip07(): Promise<Identity> {
    if (!window.nostr) throw new Error("NIP-07 extension not available");

    const pubkey = await window.nostr.getPublicKey();
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
    set({ identity, keyStore, usingNip07: true, usingPasskey: false, passkeySigner: null, isNewUser: false });
    return identity;
  },

  async createPasskeyIdentity(): Promise<Identity> {
    const { registerPasskeyIdentity, buildPasskeySignerShim } = await import("nostr-passkey");
    const { secretKey, pubkey, record } = await registerPasskeyIdentity({ rpName: "Nostr Suite" });
    const npub = npubEncode(pubkey);

    try {
      localStorage.setItem(PASSKEY_RECORD_KEY, JSON.stringify(record));
    } catch {}

    const identity: Identity = {
      npub,
      nsec: null,
      pubkey,
      nip05: null,
      nip05Verified: false,
      profile: null,
    };

    const keyStore = getKeyStore();
    keyStore.save(identity);

    const shim = buildPasskeySignerShim(secretKey);
    const passkeySigner: PasskeySignerWrapper = {
      getPublicKey: () => pubkey,
      signEvent: (e) => shim.signEvent(e),
      destroy: () => shim.destroy(),
    };
    set({ identity, keyStore, usingPasskey: true, usingNip07: false, passkeySigner, isNewUser: true });
    return identity;
  },

  async unlockPasskeyIdentity(): Promise<Identity> {
    const { unlockPasskeyIdentity, buildPasskeySignerShim } = await import("nostr-passkey");
    const { secretKey, pubkey } = await unlockPasskeyIdentity();
    const npub = npubEncode(pubkey);

    const keyStore = getKeyStore();
    let existing = keyStore.load();
    if (existing && existing.pubkey !== pubkey) {
      existing = null;
    }
    const identity: Identity = existing ?? {
      npub,
      nsec: null,
      pubkey,
      nip05: null,
      nip05Verified: false,
      profile: null,
    };
    if (!existing) keyStore.save(identity);

    const shim = buildPasskeySignerShim(secretKey);
    const passkeySigner: PasskeySignerWrapper = {
      getPublicKey: () => pubkey,
      signEvent: (e) => shim.signEvent(e),
      destroy: () => shim.destroy(),
    };
    set({ identity, keyStore, usingPasskey: true, usingNip07: false, passkeySigner, isNewUser: !existing });
    return identity;
  },

  async connectNip46(uri: string): Promise<Identity> {
    const { BunkerSigner } = await import("nostr-tools/nip46");
    const { generateSecretKey } = await import("nostr-tools/pure");

    const clientSecretKey = generateSecretKey();
    const signer = await BunkerSigner.fromURI(clientSecretKey, uri);
    const pubkey = await signer.getPublicKey();
    const npub = npubEncode(pubkey);

    const identity: Identity = {
      npub,
      nsec: null,
      pubkey,
      nip05: null,
      nip05Verified: false,
      profile: null,
    };

    const keyStore = getKeyStore();
    keyStore.save(identity);
    set({ identity, keyStore, usingNip07: false, usingPasskey: false, passkeySigner: null, isNewUser: false });
    return identity;
  },

  logout: () => {
    const { keyStore, passkeySigner } = get();
    keyStore?.clear();
    passkeySigner?.destroy();
    try { localStorage.removeItem(PASSKEY_RECORD_KEY); } catch {}
    set({ identity: null, keyStore: null, usingNip07: false, usingPasskey: false, passkeySigner: null, isNewUser: false });
  },

  async refreshProfile() {
    const { identity } = get();
    if (!identity?.pubkey) return;
    const { useProfilesStore } = await import("@/lib/stores/profiles");
    const profile = await useProfilesStore.getState().fetchProfile(identity.pubkey);
    if (profile) {
      set((state) => {
        const updated = state.identity ? { ...state.identity, profile, nip05: profile.nip05 ?? null } : null;
        if (updated) get().keyStore?.save(updated);
        return { identity: updated };
      });
    }
  },

  async publishProfile(profileData: { displayName: string; username: string; about: string; picture?: string }) {
    const { identity, usingNip07, passkeySigner } = get();
    if (!identity) throw new Error("No identity");

    const { useRelaysStore } = await import("@/lib/stores/relays");
    const pool = useRelaysStore.getState().pool;
    if (!pool) throw new Error("Relay pool not connected");

    let signedEvent: any;

    if (usingNip07 && window.nostr) {
      const pubkey = await window.nostr.getPublicKey();
      const event = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({
          name: profileData.username,
          display_name: profileData.displayName,
          about: profileData.about,
          picture: profileData.picture,
        }),
        pubkey,
      };
      const sig = await window.nostr.signEvent(event);
      signedEvent = { ...event, sig, id: "" };
    } else if (passkeySigner) {
      const pubkey = passkeySigner.getPublicKey();
      const event = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({
          name: profileData.username,
          display_name: profileData.displayName,
          about: profileData.about,
          picture: profileData.picture,
        }),
        pubkey,
      };
      const sig = await passkeySigner.signEvent(event);
      signedEvent = { ...event, sig, id: "" };
    } else if (identity.nsec) {
      const { decode } = await import("nostr-tools/nip19");
      const nsecDecoded = decode(identity.nsec);
      if (nsecDecoded.type !== "nsec") throw new Error("Invalid nsec");
      const sk = nsecDecoded.data;
      const eventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({
          name: profileData.username,
          display_name: profileData.displayName,
          about: profileData.about,
          picture: profileData.picture,
        }),
      };
      signedEvent = finalizeEvent(eventTemplate, sk);
    } else {
      throw new Error("No signer available");
    }

    await pool.publish(signedEvent);

    set((state) => {
      const updated = state.identity ? {
        ...state.identity,
        profile: {
          name: profileData.username,
          displayName: profileData.displayName,
          about: profileData.about,
          picture: profileData.picture ?? "",
          banner: "",
          website: "",
          nip05: "",
          lud06: "",
          lud16: "",
        },
      } : null;
      if (updated) get().keyStore?.save(updated);
      return { identity: updated, isNewUser: false };
    });
  },

  getSigner: () => {
    const { usingNip07, usingPasskey, passkeySigner, identity } = get();
    if (usingNip07 && window.nostr) {
      return window.nostr;
    }
    if (usingPasskey && passkeySigner) {
      return {
        getPublicKey: async () => identity?.pubkey ?? "",
        signEvent: async (event: any) => passkeySigner.signEvent(event),
      } as Nip07Signer;
    }
    return null;
  },
}));
