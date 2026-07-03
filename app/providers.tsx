"use client";

import { useEffect } from "react";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";
import { useMailboxStore } from "@/lib/stores/mailboxes";
import { startSync, loadCachedMessages } from "@/lib/sync";
import { loadBlossomConfig } from "@/lib/stores/blossom";
import { isTauri, createTauriKeyStore } from "@/lib/tauri";

export default function Providers({ children }: { children: React.ReactNode }) {
  const createOrImport = useIdentityStore((s) => s.createOrImport);
  const connectNip07 = useIdentityStore((s) => s.connectNip07);
  const nip07Available = useIdentityStore((s) => s.nip07Available);
  const connect = useRelaysStore((s) => s.connect);

  useEffect(() => {
    (async () => {
      const keyStore = isTauri() ? createTauriKeyStore() : (await import("@post/nostr-core")).createKeyStore();
      const existing = keyStore.load();

      if (existing) {
        // Already have an identity
      } else if (nip07Available) {
        try {
          await connectNip07();
        } catch {
          await createOrImport();
        }
      } else {
        await createOrImport();
      }

      loadBlossomConfig();
      await loadCachedMessages();
      await useMailboxStore.getState().refreshUnreadCounts();
      await connect();
      startSync();
    })();
  }, []);

  return <>{children}</>;
}
