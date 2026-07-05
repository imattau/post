import type { Identity } from "@post/nostr-core";
import type { KeyStore } from "@post/nostr-core";
import { generateId } from "@/lib/utils";

declare global {
  interface Window {
    __TAURI__?: Record<string, unknown>;
  }
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!window.__TAURI__;
}

async function getOrCreateVaultPassword(): Promise<string> {
  if (!isTauri()) throw new Error("Not in Tauri environment");
  const { Store } = await import("@tauri-apps/plugin-store");
  const store = await (Store.load("post-vault.json") as Promise<any>);
  const existing = await store.get("vault-password") as string | null;
  if (existing) return existing;
  const password = generateId();
  await store.set("vault-password", password);
  await store.save();
  return password;
}

async function getStrongholdStore() {
  if (!isTauri()) throw new Error("Not in Tauri environment");
  const { Stronghold } = await import("@tauri-apps/plugin-stronghold");
  const { appDataDir } = await import("@tauri-apps/api/path");

  const vaultPassword = await getOrCreateVaultPassword();
  const vaultPath = `${await appDataDir()}/post-vault.hold`;
  const stronghold = await Stronghold.load(vaultPath, vaultPassword);

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
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...identity, nsec: null }));
      } catch (e) { console.error("Failed to save identity to localStorage:", e); }
      if (identity.nsec) {
        getStrongholdStore().then(({ stronghold, store }) => {
          const data = Array.from(new TextEncoder().encode(identity.nsec!));
          store.insert("nostr-nsec", data).then(() => stronghold.save());
        }).catch((e) => { console.error("Failed to save nsec to Stronghold:", e); });
      }
    },
    clear(): void {
      cached = null;
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (e) { console.error("Failed to remove identity from localStorage:", e); }
      getStrongholdStore().then(({ store }) => {
        store.remove("nostr-nsec");
      }).catch((e) => { console.error("Failed to remove nsec from Stronghold:", e); });
    },
  };
}
