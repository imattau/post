import { create } from "zustand";
import { uploadBlob } from "@post/nostr-core";
import type { AttachmentRef } from "@post/nostr-core";
import { useSettingsStore } from "@/lib/stores/settings";

interface BlossomState {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  uploadFile: (
    file: File,
    sk: Uint8Array,
    onProgress?: (pct: number) => void
  ) => Promise<AttachmentRef>;
}

export const useBlossomStore = create<BlossomState>((set, get) => ({
  serverUrl: "",

  setServerUrl: (url: string) => {
    set({ serverUrl: url });
    useSettingsStore.getState().setValue("blossom-server-url", url);
  },

  async uploadFile(file, sk, onProgress) {
    const { serverUrl } = get();
    if (!serverUrl) throw new Error("Upload not configured");
    return uploadBlob({ url: serverUrl }, file, sk, onProgress);
  },
}));

export function loadBlossomConfig() {
  const url = useSettingsStore.getState().values["blossom-server-url"];
  if (url) useBlossomStore.getState().setServerUrl(url as string);
}
