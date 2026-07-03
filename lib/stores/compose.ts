import { create } from "zustand";
import type { Draft, RecipientEntry, AttachmentUpload, SendResult } from "@/lib/types";

export type ComposeStatus = "closed" | "composing" | "minimized" | "sending" | "scheduled" | "sent" | "failed";

interface ComposeState {
  status: ComposeStatus;
  draft: Draft;
  uploads: AttachmentUpload[];
  encrypted: boolean;
  giftWrap: boolean;
  relayOverrides: string[];
  error: string | null;
  open: (draft?: Partial<Draft>) => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  updateRecipients: (to: RecipientEntry[], cc: RecipientEntry[], bcc: RecipientEntry[]) => void;
  updateSubject: (subject: string) => void;
  updateBody: (body: string) => void;
  addAttachment: (file: File) => void;
  updateAttachment: (fileName: string, patch: Partial<Omit<AttachmentUpload, "file">>) => void;
  removeAttachment: (id: string) => void;
  toggleEncrypted: () => void;
  toggleGiftWrap: () => void;
  setRelayOverrides: (relays: string[]) => void;
  send: () => Promise<SendResult>;
  retry: () => Promise<SendResult>;
  scheduleSend: (at: number) => Promise<void>;
  autosave: () => Promise<void>;
  discard: () => void;
  resetDraft: () => void;
  returnToComposing: () => void;
}

function emptyDraft(): Draft {
  return {
    id: crypto.randomUUID(),
    to: [],
    cc: [],
    bcc: [],
    subject: "",
    body: "",
    attachments: [],
    relayOverrides: [],
    replyTo: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    savedAt: null,
    scheduledFor: null,
  };
}

export const useComposeStore = create<ComposeState>((set, get) => ({
  status: "closed",
  draft: emptyDraft(),
  uploads: [],
  encrypted: true,
  giftWrap: false,
  relayOverrides: [],
  error: null,

  open: (draft?: Partial<Draft>) => {
    set({ status: "composing", draft: { ...emptyDraft(), ...draft, updatedAt: Date.now() }, error: null });
  },

  close: () => {
    const { draft } = get();
    const hasContent = draft.to.length > 0 || draft.subject || draft.body;
    if (hasContent) {
      get().autosave();
    }
    set({ status: "closed", draft: emptyDraft(), uploads: [], error: null });
  },

  minimize: () => {
    const { draft } = get();
    if (draft.to.length === 0 && !draft.subject && !draft.body) {
      return;
    }
    get().autosave();
    set({ status: "minimized" });
  },

  restore: () => {
    set({ status: "composing" });
  },

  updateRecipients: (to, cc, bcc) => {
    set((state) => ({
      draft: { ...state.draft, to, cc, bcc, updatedAt: Date.now() },
      status: state.status === "failed" ? "composing" : state.status,
    }));
  },

  updateSubject: (subject: string) => {
    set((state) => ({
      draft: { ...state.draft, subject, updatedAt: Date.now() },
      status: state.status === "failed" ? "composing" : state.status,
    }));
  },

  updateBody: (body: string) => {
    set((state) => ({
      draft: { ...state.draft, body, updatedAt: Date.now() },
      status: state.status === "failed" ? "composing" : state.status,
    }));
  },

  addAttachment: (file: File) => {
    const upload: AttachmentUpload = {
      file,
      progress: 0,
      status: "pending",
      error: null,
      result: null,
    };
    set((state) => ({ uploads: [...state.uploads, upload] }));
  },

  updateAttachment: (fileName, patch) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.file.name === fileName ? { ...upload, ...patch } : upload
      ),
    }));
  },

  removeAttachment: (id: string) => {
    set((state) => ({ uploads: state.uploads.filter((u) => u.file.name !== id) }));
  },

  toggleEncrypted: () => {
    set((state) => ({ encrypted: !state.encrypted }));
  },

  toggleGiftWrap: () => {
    set((state) => ({ giftWrap: !state.giftWrap }));
  },

  setRelayOverrides: (relays: string[]) => {
    set({ relayOverrides: relays });
  },

  async send() {
    set({ status: "sending", error: null });
    try {
      const { sendMessage, createKeyStore } = await import("@post/nostr-core");
      const { draft, encrypted, giftWrap, relayOverrides, uploads } = get();
      const keyStore = createKeyStore();
      const identity = keyStore.load();
      if (!identity?.nsec) throw new Error("No private key");

      if (draft.to.length === 0) throw new Error("No recipient");

      const { decode } = await import("nostr-tools/nip19");
      const nsecDecoded = decode(identity.nsec);
      if (nsecDecoded.type !== "nsec") throw new Error("Invalid nsec");

      const { useRelaysStore } = await import("@/lib/stores/relays");
      const pool = useRelaysStore.getState().pool;
      if (!pool) throw new Error("Relay pool not connected");

      const attachments = uploads
        .filter((u): u is AttachmentUpload & { result: NonNullable<AttachmentUpload["result"]> } => u.status === "uploaded" && u.result !== null)
        .map((u) => u.result);

      const result = await sendMessage(pool, keyStore, {
        to: draft.to[0].pubkey,
        content: draft.body,
        subject: draft.subject || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        replyTo: draft.replyTo ?? undefined,
        relayOverrides: relayOverrides.length > 0 ? relayOverrides : undefined,
        giftWrap,
      });

      const { db } = await import("@/lib/db/schema");
      await db.drafts.delete(draft.id);

      set({ status: "sent", draft: emptyDraft(), uploads: [] });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      set({ status: "failed", error: message });
      return { eventId: "", published: new Map(), delivered: 0 };
    }
  },

  async retry() {
    return get().send();
  },

  async scheduleSend(at: number) {
    set((state) => ({
      status: "scheduled",
      draft: { ...state.draft, scheduledFor: at },
    }));
    const { db } = await import("@/lib/db/schema");
    await db.drafts.put({ ...get().draft, scheduledFor: at, savedAt: Date.now() });
  },

  async autosave() {
    const { draft } = get();
    const { db } = await import("@/lib/db/schema");
    await db.drafts.put({ ...draft, savedAt: Date.now(), updatedAt: Date.now() });
    set((state) => ({
      draft: { ...state.draft, savedAt: Date.now() },
    }));
  },

  discard: () => {
    const { draft } = get();
    (async () => {
      const { db } = await import("@/lib/db/schema");
      await db.drafts.delete(draft.id);
    })();
    set({ status: "closed", draft: emptyDraft(), uploads: [], error: null });
  },

  resetDraft: () => {
    set({ draft: emptyDraft(), uploads: [] });
  },

  returnToComposing: () => {
    set({ status: "composing" });
  },
}));
