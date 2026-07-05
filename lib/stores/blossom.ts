import { create } from "zustand";
import { uploadBlob, fetchBlossomList } from "@post/nostr-core";
import type { AttachmentRef } from "@post/nostr-core";
import { useRelaysStore } from "@/lib/stores/relays";
import { useSettingsStore } from "@/lib/stores/settings";

interface BlossomState {
  serverUrl: string;
  serverUrls: string[];
  setServerUrl: (url: string) => void;
  uploadFile: (
    file: File,
    sk: Uint8Array,
    onProgress?: (pct: number) => void
  ) => Promise<AttachmentRef>;
  loadBlossomListFromNostr: (pubkey: string) => Promise<void>;
}

export const useBlossomStore = create<BlossomState>((set, get) => ({
  serverUrl: "",
  serverUrls: [],

  setServerUrl: (url: string) => {
    set({ serverUrl: url });
    useSettingsStore.getState().setValue("blossom-server-url", url);
  },

  async uploadFile(file, sk, onProgress) {
    const { serverUrl } = get();
    if (!serverUrl) throw new Error("Upload not configured");
    return uploadBlob({ url: serverUrl }, file, sk, onProgress);
  },

  loadBlossomListFromNostr: async (pubkey: string) => {
    const pool = useRelaysStore.getState().pool;
    if (!pool) return;

    const enabled = useSettingsStore.getState().values["use-nostr-blossom-list"];
    if (!enabled) return;

    const servers = await fetchBlossomList(pool, pubkey);
    if (servers.length === 0) return;

    set({ serverUrls: servers, serverUrl: servers[0] });
  },
}));

export function loadBlossomConfig() {
  const url = useSettingsStore.getState().values["blossom-server-url"];
  if (url) useBlossomStore.getState().setServerUrl(url as string);
}
