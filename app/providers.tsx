"use client";

import { useEffect } from "react";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";

export default function Providers({ children }: { children: React.ReactNode }) {
  const createOrImport = useIdentityStore((s) => s.createOrImport);
  const connect = useRelaysStore((s) => s.connect);

  useEffect(() => {
    (async () => {
      const { createKeyStore } = await import("@post/nostr-core");
      const keyStore = createKeyStore();
      const existing = keyStore.load();
      if (!existing) {
        createOrImport();
      }
      connect();
    })();
  }, []);

  return <>{children}</>;
}
