"use client";

import { useEffect } from "react";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";
import { startSync, loadCachedMessages } from "@/lib/sync";
import { loadBlossomConfig } from "@/lib/stores/blossom";

export default function Providers({ children }: { children: React.ReactNode }) {
  const createOrImport = useIdentityStore((s) => s.createOrImport);
  const connect = useRelaysStore((s) => s.connect);

  useEffect(() => {
    (async () => {
      const { createKeyStore } = await import("@post/nostr-core");
      const keyStore = createKeyStore();
      const existing = keyStore.load();
      if (!existing) {
        await createOrImport();
      }

      loadBlossomConfig();
      await loadCachedMessages();
      await connect();
      startSync();
    })();
  }, []);

  return <>{children}</>;
}
