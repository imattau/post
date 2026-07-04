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
  openSavedDraft: (id: string) => Promise<void>;
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
  listDrafts: () => Promise<Draft[]>;
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
    const next = { ...emptyDraft(), ...draft, updatedAt: Date.now() };
    set({ status: "composing", draft: next, relayOverrides: next.relayOverrides, error: null });
  },

  async openSavedDraft(id: string) {
    const { db } = await import("@/lib/db/schema");
    const draft = await db.drafts.get(id);
    if (!draft) return;
    set({ status: "composing", draft, uploads: draft.attachments, relayOverrides: draft.relayOverrides, error: null });
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
    set((state) => ({ relayOverrides: relays, draft: { ...state.draft, relayOverrides: relays } }));
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
      const now = Date.now();
      const sentMessage = {
        id: result.eventId || draft.id,
        kind: giftWrap ? 1059 : 14,
        pubkey: identity.pubkey,
        recipientPubkey: draft.to[0].pubkey,
        content: draft.body,
        raw: "",
        createdAt: now,
        tags: draft.replyTo ? [["e", draft.replyTo]] : [],
        subject: draft.subject || "(no subject)",
        preview: draft.body.replace(/\n/g, " ").slice(0, 120),
        read: true,
        starred: false,
        archived: false,
        snoozedUntil: null,
        spam: false,
        mailbox: "sent" as const,
        labelIds: [],
        replyTo: draft.replyTo,
        relayUrls: relayOverrides,
        attachments,
        isEncrypted: encrypted,
        isGiftWrapped: giftWrap,
        deliveryStatus: result.delivered > 0 ? "delivered" as const : "failed" as const,
      };
      await db.messages.put(sentMessage);
      await db.drafts.delete(draft.id);
      const { useMessagesStore } = await import("@/lib/stores/messages");
      await useMessagesStore.getState().upsertMessage(sentMessage);

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
    await db.drafts.put({ ...get().draft, attachments: get().uploads, scheduledFor: at, savedAt: Date.now() });
  },

  async autosave() {
    const { draft, uploads } = get();
    const { db } = await import("@/lib/db/schema");
    await db.drafts.put({ ...draft, attachments: uploads, savedAt: Date.now(), updatedAt: Date.now() });
    set((state) => ({
      draft: { ...state.draft, savedAt: Date.now() },
    }));
  },

  async listDrafts() {
    const { db } = await import("@/lib/db/schema");
    return db.drafts.orderBy("updatedAt").reverse().toArray();
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
