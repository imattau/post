"use client";

import { useEffect, useRef } from "react";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";
import { useMailboxStore } from "@/lib/stores/mailboxes";
import { startSync, loadCachedMessages } from "@/lib/sync";
import { loadBlossomConfig, useBlossomStore } from "@/lib/stores/blossom";
import { useContactsStore } from "@/lib/stores/contacts";
import { useSettingsStore } from "@/lib/stores/settings";

function applyTheme(theme: string) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

function applyDensity(density: string) {
  document.documentElement.setAttribute("data-density", density);
}

function ThemeApplier() {
  const theme = useSettingsStore((s) => s.values["theme"]);
  const density = useSettingsStore((s) => s.values["density"]);

  useEffect(() => {
    applyTheme(theme ?? "dark");
    applyDensity(density ?? "comfortable");
  }, [theme, density]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return null;
}

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
      useSettingsStore.getState().load();

      const settings = useSettingsStore.getState().values;

      loadBlossomConfig();

      const downloadMetadata = settings["download-profile-metadata"] ?? true;

      if (downloadMetadata) {
        await useContactsStore.getState().loadContacts();
        useIdentityStore.getState().refreshProfile();
      }
      await useRelaysStore.getState().loadRelayConfigs();
      await loadCachedMessages();
      await useMailboxStore.getState().refreshUnreadCounts();
      await connect();

      if (settings["use-nostr-relay-list"]) {
        await useRelaysStore.getState().loadRelayListFromNostr(identity.pubkey);
        useRelaysStore.getState().disconnect();
        await connect();
      }

      if (settings["use-nostr-blossom-list"]) {
        await useBlossomStore.getState().loadBlossomListFromNostr(identity.pubkey);
      }

      startSync();
    })();
  }, [identity]);

  return (
    <>
      <ThemeApplier />
      {children}
    </>
  );
}
