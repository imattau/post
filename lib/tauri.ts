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

export function createTauriKeyStore(): KeyStore {
  let cached: Identity | null = null;

  return {
    load(): Identity | null {
      return cached;
    },
    save(identity: Identity): void {
      cached = identity;
      if (identity.nsec) {
        getStrongholdStore().then(({ stronghold, store }) => {
          const data = Array.from(new TextEncoder().encode(identity.nsec!));
          store.insert("nostr-nsec", data).then(() => stronghold.save());
        }).catch(() => {
          try { localStorage.setItem("nostr-identity", JSON.stringify(identity)); } catch {}
        });
      }
    },
    clear(): void {
      cached = null;
      getStrongholdStore().then(({ store }) => {
        store.remove("nostr-nsec");
      }).catch(() => {
        try { localStorage.removeItem("nostr-identity"); } catch {}
      });
    },
  };
}
