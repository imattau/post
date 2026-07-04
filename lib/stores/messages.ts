import { create } from "zustand";
import type { Message, MailboxKind } from "@/lib/types";

interface MessagesState {
  byId: Record<string, Message>;
  ids: string[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;

  loadFromCache: () => Promise<void>;
  selectMessage: (id: string | null) => void;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  toggleSpam: (id: string) => Promise<void>;
  snooze: (id: string, until: number) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  ingestFromRelay: (message: Message) => void;
  upsertMessage: (message: Message) => Promise<void>;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  byId: {},
  ids: [],
  selectedId: null,
  loading: false,
  error: null,

  async loadFromCache() {
    const { db } = await import("@/lib/db/schema");
    const messages = await db.messages.orderBy("createdAt").reverse().toArray();
    const byId: Record<string, Message> = {};
    const ids: string[] = [];
    for (const m of messages) {
      byId[m.id] = m;
      ids.push(m.id);
    }
    set({ byId, ids, loading: false });
  },

  selectMessage: (id: string | null) => {
    set({ selectedId: id });
  },

  async markRead(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg || msg.read) return;
    const updated = { ...msg, read: true };
    const { db } = await import("@/lib/db/schema");
    await db.messages.put(updated);
    set({ byId: { ...byId, [id]: updated } });
  },

  async markUnread(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg || !msg.read) return;
    const updated = { ...msg, read: false };
    const { db } = await import("@/lib/db/schema");
    await db.messages.put(updated);
    set({ byId: { ...byId, [id]: updated } });
  },

  async toggleStar(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg) return;
    const updated = { ...msg, starred: !msg.starred };
    const { db } = await import("@/lib/db/schema");
    await db.messages.put(updated);
    set({ byId: { ...byId, [id]: updated } });
  },

  async toggleArchive(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg) return;
    const updated = { ...msg, archived: !msg.archived, mailbox: (msg.archived ? "inbox" : "archive") as MailboxKind };
    const { db } = await import("@/lib/db/schema");
    await db.messages.put(updated);
    set({ byId: { ...byId, [id]: updated } });
  },

  async toggleSpam(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg) return;
    const updated = { ...msg, spam: !msg.spam, mailbox: (msg.spam ? "inbox" : "spam") as MailboxKind };
    const { db } = await import("@/lib/db/schema");
    await db.messages.put(updated);
    set({ byId: { ...byId, [id]: updated } });
  },

  async snooze(id: string, until: number) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg) return;
    const updated = { ...msg, snoozedUntil: until, mailbox: "snoozed" as MailboxKind };
    const { db } = await import("@/lib/db/schema");
    await db.messages.put(updated);
    set({ byId: { ...byId, [id]: updated } });
  },

  async deleteMessage(id: string) {
    const { byId, ids } = get();
    const { [id]: _, ...rest } = byId;
    const { db } = await import("@/lib/db/schema");
    await db.messages.delete(id);
    set({ byId: rest, ids: ids.filter((i) => i !== id) });
  },

  ingestFromRelay: (message: Message) => {
    const { byId, ids } = get();
    if (byId[message.id]) return;
    set({
      byId: { ...byId, [message.id]: message },
      ids: [message.id, ...ids],
    });
  },

  async upsertMessage(message: Message) {
    const { byId, ids } = get();
    const { db } = await import("@/lib/db/schema");
    await db.messages.put(message);
    set({
      byId: { ...byId, [message.id]: message },
      ids: ids.includes(message.id) ? ids : [message.id, ...ids],
    });
  },
}));
