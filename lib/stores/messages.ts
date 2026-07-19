import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { db } from "@/lib/db/schema";
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
  ingestFromRelay: (message: Message) => Promise<void>;
  upsertMessage: (message: Message) => Promise<void>;
  startSnoozeWatcher: () => () => void;
}

export const useMessagesStore = create<MessagesState>()(immer((set, get) => ({
  byId: {},
  ids: [],
  selectedId: null,
  loading: false,
  error: null,

  async loadFromCache() {
    const messages = await db.messages.orderBy("createdAt").reverse().toArray();
    const byId: Record<string, Message> = {};
    const ids: string[] = [];
    for (const m of messages) {
      byId[m.id] = m;
      ids.push(m.id);
    }
    set((state) => { state.byId = byId; state.ids = ids; state.loading = false; });
  },

  selectMessage: (id: string | null) => {
    set({ selectedId: id });
  },

  async markRead(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg || msg.read) return;
    const updated = { ...msg, read: true };
    await db.messages.put(updated);
    set((state) => { state.byId[id] = updated; });
  },

  async markUnread(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg || !msg.read) return;
    const updated = { ...msg, read: false };
    await db.messages.put(updated);
    set((state) => { state.byId[id] = updated; });
  },

  async toggleStar(id: string) {
    const msg = get().byId[id];
    if (!msg) return;
    const updated = { ...msg, starred: !msg.starred };
    await db.messages.put(updated);
    set((state) => { state.byId[id] = updated; });
  },

  async toggleArchive(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg) return;
    const becomingArchived = !msg.archived;
    const updated = {
      ...msg,
      archived: becomingArchived,
      mailbox: becomingArchived ? "archive" as MailboxKind : (msg.mailbox === "archive" ? "inbox" as MailboxKind : msg.mailbox),
    };
    await db.messages.put(updated);
    set((state) => { state.byId[id] = updated; });
  },

  async toggleSpam(id: string) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg) return;
    const becomingSpam = !msg.spam;
    const updated = {
      ...msg,
      spam: becomingSpam,
      mailbox: becomingSpam ? "spam" as MailboxKind : (msg.mailbox === "spam" ? "inbox" as MailboxKind : msg.mailbox),
    };
    await db.messages.put(updated);
    set((state) => { state.byId[id] = updated; });
  },

  async snooze(id: string, until: number) {
    const { byId } = get();
    const msg = byId[id];
    if (!msg) return;
    const updated = { ...msg, snoozedUntil: until, mailbox: "snoozed" as MailboxKind };
    await db.messages.put(updated);
    set((state) => { state.byId[id] = updated; });
  },

  async deleteMessage(id: string) {
    const { byId, ids } = get();
    await db.messages.delete(id);
    set((state) => { delete state.byId[id]; state.ids = state.ids.filter((i) => i !== id); });
  },

  ingestFromRelay: async (message: Message) => {
    const { byId } = get();
    if (byId[message.id]) return;
    await db.messages.put(message);
    set((state) => { state.byId[message.id] = message; state.ids.unshift(message.id); });
  },

  async upsertMessage(message: Message) {
    const { byId, ids } = get();
    await db.messages.put(message);
    set((state) => {
      state.byId[message.id] = message;
      if (!state.ids.includes(message.id)) state.ids.unshift(message.id);
    });
  },

  startSnoozeWatcher: () => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const check = () => {
      const { byId } = get();
      const now = Date.now();
      const updates: Record<string, Message> = {};
      let nextSnooze = Infinity;

      for (const msg of Object.values(byId)) {
        if (msg.snoozedUntil !== null) {
          if (msg.snoozedUntil <= now) {
            updates[msg.id] = { ...msg, snoozedUntil: null, mailbox: "inbox" };
          } else {
            nextSnooze = Math.min(nextSnooze, msg.snoozedUntil - now);
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        set((state) => { Object.assign(state.byId, updates); });
        for (const msg of Object.values(updates)) {
          db.messages.put(msg);
        }
      }

      const delay = Math.min(nextSnooze === Infinity ? 30000 : nextSnooze, 30000);
      timeoutId = setTimeout(check, Math.max(delay, 1000));
    };

    check();
    return () => { if (timeoutId !== null) clearTimeout(timeoutId); };
  },
})));
