import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { sendMessage, createKeyStore } from "@post/nostr-core";
import { decode } from "nostr-tools/nip19";
import { generateId, draftHasContent } from "@/lib/utils";
import { graph, putNode, deleteNode, getNode, getNodesOrdered, addEdge, ensureConversation, EDGE, messageSearchText } from "@/lib/db/poly";
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
    conversationId: generateId(),
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
    const base = emptyDraft();
    let conversationId = base.conversationId;
    if (draft?.replyTo) {
      const parent = useMessagesStore.getState().byId[draft.replyTo];
      if (parent) {
        const parentConvId = graph.getEdgeTargets(parent.id, EDGE.PART_OF)[0] ?? null;
        if (parentConvId) conversationId = parentConvId;
      }
    }
    const next = { ...base, conversationId, ...draft, updatedAt: Date.now() };
    set({
      status: "composing",
      draft: next,
      relayOverrides: next.relayOverrides,
      error: null,
      encrypted: useSettingsStore.getState().getValue("encrypt-direct-posts", true),
    });
  },

  async openSavedDraft(id: string) {
    const draft = await getNode<Draft>(id);
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
      const identity = await keyStore.load();
      if (!identity?.nsec) throw new Error("Cannot send message");

      if (draft.to.length === 0 && draft.cc.length === 0) throw new Error("Cannot send message");

      const nsecDecoded = decode(identity.nsec);
      if (nsecDecoded.type !== "nsec") throw new Error("Cannot send message");

      const pool = useRelaysStore.getState().pool;
      if (!pool) throw new Error("Cannot send message");

      const attachments = uploads
        .filter((u): u is AttachmentUpload & { result: NonNullable<AttachmentUpload["result"]> } => u.status === "uploaded" && u.result !== null)
        .map((u) => u.result);

      let overallDelivered = 0;
      const now = Date.now();
      const toCcRecipients = [...draft.to, ...draft.cc];
      const hasMultipleToCc = toCcRecipients.length > 1;

      async function saveSent(eventId: string, recipientPubkey: string, kind: number, deliveryStatus: "delivered" | "failed", isGiftWrapped?: boolean) {
        const msg = {
          id: eventId || draft.id,
          kind,
          pubkey: identity!.pubkey,
          recipientPubkey,
          content: draft.body,
          raw: "",
          createdAt: now,
          tags: [
            ...(draft.replyTo ? [["e", draft.replyTo]] : []),
            ["p", recipientPubkey],
            ...(draft.conversationId ? [["conversation", draft.conversationId]] : []),
          ],
          subject: draft.subject || "(no subject)",
          preview: draft.body.replace(/\n/g, " ").slice(0, 120),
          read: true,
          starred: false,
          archived: false,
          snoozedUntil: null,
          spam: false,
          mailbox: "sent" as const,
          relayUrls: relayOverrides,
          attachments,
          isEncrypted: encrypted,
          isGiftWrapped: isGiftWrapped ?? kind === 1059,
          deliveryStatus,
        };
        await putNode('message', msg.id, msg as any, messageSearchText(msg as any));
        await useMessagesStore.getState().upsertMessage(msg);
        if (draft.replyTo) await addEdge(msg.id, EDGE.REPLIES_TO, draft.replyTo);
        if (draft.conversationId) {
          await ensureConversation(draft.conversationId);
          await addEdge(msg.id, EDGE.PART_OF, draft.conversationId);
        }
      }

      if (hasMultipleToCc) {
        const { useGroupsStore } = await import("@/lib/stores/groups");
        const groupsStore = useGroupsStore.getState();
        const allMembers = toCcRecipients.map((r) => ({ pubkey: r.pubkey, npub: r.npub, name: r.name, avatarUrl: r.avatarUrl, isGroup: false }));
        const groupInbox = groupsStore.createGroupInbox(draft.conversationId, allMembers);
        const result = await sendMessage(pool, keyStore, {
          to: groupInbox.pubkey,
          content: draft.body,
          subject: draft.subject || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
          replyTo: draft.replyTo ?? undefined,
          conversationId: draft.conversationId,
          groupPubkey: groupInbox.pubkey,
          groupMembers: allMembers.map((m) => m.pubkey),
          groupKey: { pubkey: groupInbox.pubkey, privkey: groupInbox.privkey },
          giftWrap: true,
        });
        if (result.delivered > 0) overallDelivered++;
        await saveSent(result.eventId, groupInbox.pubkey, 1059, result.delivered > 0 ? "delivered" : "failed", true);
        const { resubscribeGroupPubkeys } = await import("@/lib/sync");
        await resubscribeGroupPubkeys();
      } else {
        for (const recipient of toCcRecipients) {
          const result = await sendMessage(pool, keyStore, {
            to: recipient.pubkey,
            content: draft.body,
            subject: draft.subject || undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
            replyTo: draft.replyTo ?? undefined,
            conversationId: draft.conversationId,
            relayOverrides: relayOverrides.length > 0 ? relayOverrides : undefined,
            giftWrap,
          });
          if (result.delivered > 0) overallDelivered++;
          const kind = giftWrap ? 1059 : 14;
          await saveSent(result.eventId || draft.id, recipient.pubkey, kind, result.delivered > 0 ? "delivered" : "failed", giftWrap);
        }
      }

      for (const recipient of draft.bcc) {
        const result = await sendMessage(pool, keyStore, {
          to: recipient.pubkey,
          content: draft.body,
          subject: draft.subject || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
          replyTo: draft.replyTo ?? undefined,
          conversationId: draft.conversationId,
          relayOverrides: relayOverrides.length > 0 ? relayOverrides : undefined,
        });
        if (result.delivered > 0) overallDelivered++;
        await saveSent(result.eventId, recipient.pubkey, 14, result.delivered > 0 ? "delivered" : "failed");
      }

      await deleteNode(draft.id);

      set({ status: "sent", draft: emptyDraft(), uploads: [] });
      return { eventId: "", published: new Map(), delivered: overallDelivered };
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
    await putNode('draft', get().draft.id, { ...get().draft, attachments: get().uploads, scheduledFor: at, savedAt: Date.now() } as any);
  },

  async autosave() {
    const { draft, uploads } = get();
    await putNode('draft', draft.id, { ...draft, attachments: uploads, savedAt: Date.now(), updatedAt: Date.now() } as any);
    set((state) => { state.draft.savedAt = Date.now(); state.draftVersion += 1; });
  },

  async listDrafts() {
    return getNodesOrdered<any>('draft', 'updatedAt');
  },

  discard: () => {
    const { draft } = get();
    (async () => {
      await deleteNode(draft.id);
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
      const identity = await keyStore.load();
      if (!identity?.nsec) throw new Error("Cannot send message");

      if (to.length === 0) throw new Error("Cannot send message");

      const nsecDecoded = decode(identity.nsec);
      if (nsecDecoded.type !== "nsec") throw new Error("Cannot send message");

      const pool = useRelaysStore.getState().pool;
      if (!pool) throw new Error("Cannot send message");

      const conversationId = replyTo
        ? (graph.getEdgeTargets(replyTo, EDGE.PART_OF)[0] ?? generateId())
        : generateId();

      let overallDelivered = 0;
      const now = Date.now();

      for (const recipient of to) {
        const result = await sendMessage(pool, keyStore, {
          to: recipient.pubkey,
          content: body,
          subject: subject || undefined,
          replyTo: replyTo ?? undefined,
          conversationId,
        });

        if (result.delivered > 0) overallDelivered++;

        const sentMessage = {
          id: result.eventId,
          kind: 14,
          pubkey: identity.pubkey,
          recipientPubkey: recipient.pubkey,
          content: body,
          raw: "",
          createdAt: now,
          tags: [
            ...(replyTo ? [["e", replyTo]] : []),
            ["p", recipient.pubkey],
            ...(conversationId ? [["conversation", conversationId]] : []),
          ],
          subject: subject || "(no subject)",
          preview: body.replace(/\n/g, " ").slice(0, 120),
          read: true,
          starred: false,
          archived: false,
          snoozedUntil: null,
          spam: false,
          mailbox: "sent" as const,
          relayUrls: [],
          attachments: [],
          isEncrypted: true,
          isGiftWrapped: false,
          deliveryStatus: result.delivered > 0 ? "delivered" as const : "failed" as const,
        };
        await putNode('message', sentMessage.id, sentMessage as any, messageSearchText(sentMessage as any));
        await useMessagesStore.getState().upsertMessage(sentMessage);
        if (replyTo) await addEdge(sentMessage.id, EDGE.REPLIES_TO, replyTo);
        if (conversationId) {
          await ensureConversation(conversationId);
          await addEdge(sentMessage.id, EDGE.PART_OF, conversationId);
        }
      }

      return overallDelivered > 0;
    } catch {
      return false;
    }
  },
})));
