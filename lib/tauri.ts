import type { Identity } from "@post/nostr-core";
import type { KeyStore } from "@post/nostr-core";

declare global {
  interface Window {
    __TAURI__?: Record<string, unknown>;
  }
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!window.__TAURI__;
}

async function getStrongholdStore() {
  const { Stronghold } = await import("@tauri-apps/plugin-stronghold");
  const { appDataDir } = await import("@tauri-apps/api/path");

  const vaultPath = `${await appDataDir()}/post-vault.hold`;
  const stronghold = await Stronghold.load(vaultPath, "post-vault-password");

  let client;
  try {
    client = await stronghold.loadClient("post-client");
  } catch {
    client = await stronghold.createClient("post-client");
  }

  return { stronghold, store: client.getStore() };
}

const SESSION_KEY = "nostr-identity";

export function createTauriKeyStore(): KeyStore {
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
      } catch {}
      if (identity.nsec) {
        getStrongholdStore().then(({ stronghold, store }) => {
          const data = Array.from(new TextEncoder().encode(identity.nsec!));
          store.insert("nostr-nsec", data).then(() => stronghold.save());
        }).catch(() => {});
      }
    },
    clear(): void {
      cached = null;
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {}
      getStrongholdStore().then(({ store }) => {
        store.remove("nostr-nsec");
      }).catch(() => {});
    },
  };
}
