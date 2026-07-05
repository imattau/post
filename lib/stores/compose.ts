import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { sendMessage, createKeyStore } from "@post/nostr-core";
import { decode } from "nostr-tools/nip19";
import { generateId, draftHasContent } from "@/lib/utils";
import { db } from "@/lib/db/schema";
import { useRelaysStore } from "@/lib/stores/relays";
import { useMessagesStore } from "@/lib/stores/messages";
import type { Draft, RecipientEntry, AttachmentUpload, SendResult } from "@/lib/types";
import { useSettingsStore } from "@/lib/stores/settings";

export type ComposeStatus = "closed" | "composing" | "minimized" | "sending" | "scheduled" | "sent" | "failed";

interface ComposeState {
  status: ComposeStatus;
  draft: Draft;
  uploads: AttachmentUpload[];
  encrypted: boolean;
  giftWrap: boolean;
  relayOverrides: string[];
  error: string | null;
  draftVersion: number;
  sendDirect: (to: RecipientEntry[], subject: string, body: string, replyTo: string | null) => Promise<boolean>;
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
    id: generateId(),
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

export const useComposeStore = create<ComposeState>()(immer((set, get) => ({
  status: "closed",
  draft: emptyDraft(),
  uploads: [],
  encrypted: true,
  giftWrap: false,
  relayOverrides: [],
  error: null,
  draftVersion: 0,

  open: (draft?: Partial<Draft>) => {
    const next = { ...emptyDraft(), ...draft, updatedAt: Date.now() };
    set({
      status: "composing",
      draft: next,
      relayOverrides: next.relayOverrides,
      error: null,
      encrypted: useSettingsStore.getState().getValue("encrypt-direct-posts", true),
    });
  },

  async openSavedDraft(id: string) {
    const draft = await db.drafts.get(id);
    if (!draft) return;
    set({ status: "composing", draft, uploads: draft.attachments, relayOverrides: draft.relayOverrides, error: null });
  },

  close: async () => {
    const { draft } = get();
    if (draftHasContent(draft) && useSettingsStore.getState().getValue("autosave-drafts", true)) {
      await get().autosave();
    }
    set({ status: "closed", draft: emptyDraft(), uploads: [], error: null });
  },

  minimize: async () => {
    const { draft } = get();
    if (!draftHasContent(draft)) {
      return;
    }
    if (useSettingsStore.getState().getValue("autosave-drafts", true)) {
      await get().autosave();
    }
    set({ status: "minimized" });
  },

  restore: () => {
    set({ status: "composing" });
  },

  updateRecipients: (to, cc, bcc) => {
    set((state) => {
      state.draft.to = to;
      state.draft.cc = cc;
      state.draft.bcc = bcc;
      state.draft.updatedAt = Date.now();
      if (state.status === "failed") state.status = "composing";
    });
  },

  updateSubject: (subject: string) => {
    set((state) => {
      state.draft.subject = subject;
      state.draft.updatedAt = Date.now();
      if (state.status === "failed") state.status = "composing";
    });
  },

  updateBody: (body: string) => {
    set((state) => {
      state.draft.body = body;
      state.draft.updatedAt = Date.now();
      if (state.status === "failed") state.status = "composing";
    });
  },

  addAttachment: (file: File) => {
    const upload: AttachmentUpload = {
      file,
      progress: 0,
      status: "pending",
      error: null,
      result: null,
    };
    set((state) => { state.uploads.push(upload); });
  },

  updateAttachment: (fileName, patch) => {
    set((state) => {
      const upload = state.uploads.find((u) => u.file.name === fileName);
      if (upload) Object.assign(upload, patch);
    });
  },

  removeAttachment: (id: string) => {
    set((state) => { state.uploads = state.uploads.filter((u) => u.file.name !== id); });
  },

  toggleEncrypted: () => {
    set((state) => ({ encrypted: !state.encrypted }));
  },

  toggleGiftWrap: () => {
    set((state) => ({ giftWrap: !state.giftWrap }));
  },

  setRelayOverrides: (relays: string[]) => {
    set((state) => { state.relayOverrides = relays; state.draft.relayOverrides = relays; });
  },

  async send() {
    set({ status: "sending", error: null });
    try {
      const { draft, encrypted, giftWrap, relayOverrides, uploads } = get();
      const keyStore = createKeyStore();
      const identity = keyStore.load();
      if (!identity?.nsec) throw new Error("Cannot send message");

      if (draft.to.length === 0) throw new Error("Cannot send message");

      const nsecDecoded = decode(identity.nsec);
      if (nsecDecoded.type !== "nsec") throw new Error("Cannot send message");

      const pool = useRelaysStore.getState().pool;
      if (!pool) throw new Error("Cannot send message");

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
      await useMessagesStore.getState().upsertMessage(sentMessage);

      set({ status: "sent", draft: emptyDraft(), uploads: [] });
      return result;
    } catch (err) {
      console.error("Send failed:", err);
      set({ status: "failed", error: "Send failed" });
      return { eventId: "", published: new Map(), delivered: 0 };
    }
  },

  async retry() {
    return get().send();
  },

  async scheduleSend(at: number) {
    set((state) => { state.status = "scheduled"; state.draft.scheduledFor = at; });
    await db.drafts.put({ ...get().draft, attachments: get().uploads, scheduledFor: at, savedAt: Date.now() });
  },

  async autosave() {
    const { draft, uploads } = get();
    await db.drafts.put({ ...draft, attachments: uploads, savedAt: Date.now(), updatedAt: Date.now() });
    set((state) => { state.draft.savedAt = Date.now(); state.draftVersion += 1; });
  },

  async listDrafts() {
    return db.drafts.orderBy("updatedAt").reverse().toArray();
  },

  discard: () => {
    const { draft } = get();
    (async () => {
      await db.drafts.delete(draft.id);
    })();
    set((state) => { state.status = "closed"; state.draft = emptyDraft(); state.uploads = []; state.error = null; state.draftVersion += 1; });
  },

  resetDraft: () => {
    set({ draft: emptyDraft(), uploads: [] });
  },

  returnToComposing: () => {
    set({ status: "composing" });
  },

  async sendDirect(to: RecipientEntry[], subject: string, body: string, replyTo: string | null): Promise<boolean> {
    try {
      const keyStore = createKeyStore();
      const identity = keyStore.load();
      if (!identity?.nsec) throw new Error("Cannot send message");

      if (to.length === 0) throw new Error("Cannot send message");

      const nsecDecoded = decode(identity.nsec);
      if (nsecDecoded.type !== "nsec") throw new Error("Cannot send message");

      const pool = useRelaysStore.getState().pool;
      if (!pool) throw new Error("Cannot send message");

      const result = await sendMessage(pool, keyStore, {
        to: to[0].pubkey,
        content: body,
        subject: subject || undefined,
        replyTo: replyTo ?? undefined,
      });

      const now = Date.now();
      const sentMessage = {
        id: result.eventId,
        kind: 14,
        pubkey: identity.pubkey,
        recipientPubkey: to[0].pubkey,
        content: body,
        raw: "",
        createdAt: now,
        tags: replyTo ? [["e", replyTo]] : [],
        subject: subject || "(no subject)",
        preview: body.replace(/\n/g, " ").slice(0, 120),
        read: true,
        starred: false,
        archived: false,
        snoozedUntil: null,
        spam: false,
        mailbox: "sent" as const,
        labelIds: [],
        replyTo,
        relayUrls: [],
        attachments: [],
        isEncrypted: true,
        isGiftWrapped: false,
        deliveryStatus: result.delivered > 0 ? "delivered" as const : "failed" as const,
      };
      await db.messages.put(sentMessage);
      await useMessagesStore.getState().upsertMessage(sentMessage);

      return result.delivered > 0;
    } catch {
      return false;
    }
  },
})));
