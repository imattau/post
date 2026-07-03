import { create } from "zustand";

export type MailboxTab = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "archive" | "spam";

interface MailboxState {
  current: MailboxTab;
  unreadCounts: Record<MailboxTab, number>;
  filter: "primary" | "unread" | "starred" | "attachments";
  navigate: (tab: MailboxTab) => void;
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

  navigate: (tab: MailboxTab) => {
    set({ current: tab });
  },

  setFilter: (filter: string) => {
    set({ filter: filter as MailboxState["filter"] });
  },

  async refreshUnreadCounts() {
    const { db } = await import("@/lib/db/schema");
    const inbox = await db.messages.where({ mailbox: "inbox", archived: 0, spam: 0 }).count();
    const drafts = await db.drafts.count();
    set({ unreadCounts: { ...get().unreadCounts, inbox, drafts } });
  },
}));

function get() {
  return useMailboxStore.getState();
}
