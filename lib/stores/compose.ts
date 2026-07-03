import { create } from "zustand";
import type { Draft, RecipientEntry, AttachmentUpload, SendResult } from "@/lib/types";

type ComposeStatus = "closed" | "composing" | "minimized" | "sending" | "scheduled";

interface ComposeState {
  status: ComposeStatus;
  draft: Draft;
  uploads: AttachmentUpload[];
  encrypted: boolean;
  giftWrap: boolean;
  relayOverrides: string[];
  open: (replyTo?: Draft) => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  updateRecipients: (to: RecipientEntry[], cc: RecipientEntry[], bcc: RecipientEntry[]) => void;
  updateSubject: (subject: string) => void;
  updateBody: (body: string) => void;
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  toggleEncrypted: () => void;
  toggleGiftWrap: () => void;
  setRelayOverrides: (relays: string[]) => void;
  send: () => Promise<SendResult>;
  scheduleSend: (at: number) => Promise<void>;
  autosave: () => Promise<void>;
  discard: () => void;
  resetDraft: () => void;
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

  open: (replyTo?: Draft) => {
    set({ status: "composing", draft: replyTo ?? emptyDraft() });
  },

  close: () => {
    set({ status: "closed" });
  },

  minimize: () => {
    set({ status: "minimized" });
  },

  restore: () => {
    set({ status: "composing" });
  },

  updateRecipients: (to, cc, bcc) => {
    set((state) => ({
      draft: { ...state.draft, to, cc, bcc, updatedAt: Date.now() },
    }));
  },

  updateSubject: (subject: string) => {
    set((state) => ({ draft: { ...state.draft, subject, updatedAt: Date.now() } }));
  },

  updateBody: (body: string) => {
    set((state) => ({ draft: { ...state.draft, body, updatedAt: Date.now() } }));
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
    set({ status: "sending" });
    // Will wire to real sendMessage in later phase
    return { eventId: "", published: new Map(), delivered: 0 };
  },

  async scheduleSend(at: number) {
    set((state) => ({
      status: "scheduled",
      draft: { ...state.draft, scheduledFor: at },
    }));
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
    set({ status: "closed", draft: emptyDraft(), uploads: [] });
  },

  resetDraft: () => {
    set({ draft: emptyDraft(), uploads: [] });
  },
}));
