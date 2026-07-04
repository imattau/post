import { create } from "zustand";

export type MailboxTab = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "archive" | "spam";

interface MailboxState {
  current: MailboxTab;
  unreadCounts: Record<MailboxTab, number>;
  filter: "primary" | "unread" | "starred" | "attachments";
  setFilter: (filter: string) => void;
  refreshUnreadCounts: () => Promise<void>;
}

export const useMailboxStore = create<MailboxState>((set) => ({
  current: "inbox",
  unreadCounts: {
    inbox: 0,
    starred: 0,
    snoozed: 0,
    sent: 0,
    drafts: 0,
    archive: 0,
    spam: 0,
  },
  filter: "primary",

  setFilter: (filter: string) => {
    set({ filter: filter as MailboxState["filter"] });
  },

  async refreshUnreadCounts() {
    const { useMessagesStore } = await import("@/lib/stores/messages");
    const { byId, ids } = useMessagesStore.getState();
    const now = Date.now();
    const all = ids.map((id) => byId[id]).filter(Boolean);
    const inboxUnread = all.filter((m) => !m!.archived && !m!.spam && m!.snoozedUntil === null && !m!.read).length;
    const starred = all.filter((m) => m!.starred).length;
    const snoozed = all.filter((m) => m!.snoozedUntil !== null && m!.snoozedUntil > now).length;
    const sent = all.filter((m) => m!.mailbox === "sent").length;
    const archive = all.filter((m) => m!.archived).length;
    const spam = all.filter((m) => m!.spam).length;
    const { useComposeStore } = await import("@/lib/stores/compose");
    const drafts = await useComposeStore.getState().listDrafts();
    set({ unreadCounts: { inbox: inboxUnread, starred, snoozed, sent, drafts: drafts.length, archive, spam } });
  },
}));
