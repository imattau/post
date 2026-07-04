"use client";

import { useEffect, useRef } from "react";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";
import { useMailboxStore } from "@/lib/stores/mailboxes";
import { startSync, loadCachedMessages } from "@/lib/sync";
import { loadBlossomConfig } from "@/lib/stores/blossom";
import { useContactsStore } from "@/lib/stores/contacts";
import { useSettingsStore } from "@/lib/stores/settings";
import { isTauri, createTauriKeyStore } from "@/lib/tauri";

export default function Providers({ children }: { children: React.ReactNode }) {
  const identity = useIdentityStore((s) => s.identity);
  const setIdentity = useIdentityStore((s) => s.setIdentity);
  const connect = useRelaysStore((s) => s.connect);
  const booted = useRef(false);

  useEffect(() => {
    (async () => {
      const keyStore = isTauri() ? createTauriKeyStore() : (await import("@post/nostr-core")).createKeyStore();
      const existing = keyStore.load();
      if (existing) {
        setIdentity(existing);
      }
    })();
  }, []);

  useEffect(() => {
    if (!identity || booted.current) return;
    booted.current = true;

    (async () => {
      loadBlossomConfig();
      useSettingsStore.getState().load();
      await useContactsStore.getState().loadContacts();
      await useRelaysStore.getState().loadRelayConfigs();
      await loadCachedMessages();
      await useMailboxStore.getState().refreshUnreadCounts();
      await connect();
      startSync();
    })();
  }, [identity]);

  return <>{children}</>;
}