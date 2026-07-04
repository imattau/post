"use client";

import { useEffect, useRef } from "react";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";
import { useMailboxStore } from "@/lib/stores/mailboxes";
import { startSync, loadCachedMessages } from "@/lib/sync";
import { loadBlossomConfig } from "@/lib/stores/blossom";
import { useContactsStore } from "@/lib/stores/contacts";
import { useSettingsStore } from "@/lib/stores/settings";

export default function Providers({ children }: { children: React.ReactNode }) {
  const identity = useIdentityStore((s) => s.identity);
  const connect = useRelaysStore((s) => s.connect);
  const booted = useRef(false);

  useEffect(() => {
    useIdentityStore.getState().bootstrap();
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
      useIdentityStore.getState().refreshProfile();
      startSync();
    })();
  }, [identity]);

  return <>{children}</>;
}