import { create } from "zustand";
import { uploadBlob } from "@post/nostr-core";
import type { AttachmentRef } from "@post/nostr-core";

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
    try {
      localStorage.setItem("blossom-server-url", url);
    } catch { /* ignore */ }
  },

  async uploadFile(file, sk, onProgress) {
    const { serverUrl } = get();
    if (!serverUrl) throw new Error("No Blossom server configured");
    return uploadBlob({ url: serverUrl }, file, sk, onProgress);
  },
}));

export function loadBlossomConfig() {
  try {
    const saved = localStorage.getItem("blossom-server-url");
    if (saved) useBlossomStore.getState().setServerUrl(saved);
  } catch { /* ignore */ }
}
