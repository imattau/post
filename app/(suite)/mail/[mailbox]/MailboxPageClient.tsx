"use client";

import { useParams } from "next/navigation";
import { useMailboxMessages } from "../_components/useMailboxMessages";
import { useMessagesStore } from "@/lib/stores/messages";
import MessageListView from "../_components/MessageListView";

const config: Record<string, { title: string; subtitle: (count: number, unread: number) => string }> = {
  inbox: { title: "Inbox", subtitle: (_, unread) => `${unread} unread` },
  starred: { title: "Starred", subtitle: (count) => `${count} starred` },
  snoozed: { title: "Snoozed", subtitle: (count) => `${count} snoozed` },
  sent: { title: "Sent", subtitle: (count) => `${count} sent` },
  drafts: { title: "Drafts", subtitle: (count) => `${count} draft messages` },
  archive: { title: "Archive", subtitle: () => "Archived messages" },
  spam: { title: "Spam", subtitle: () => "Spam messages" },
};

export default function MailboxPageClient() {
  const params = useParams();
  const mailbox = (params.mailbox as string) || "inbox";
  const { messages, unreadCount } = useMailboxMessages(mailbox);
  const loading = useMessagesStore((s) => s.loading);
  const cfg = config[mailbox] ?? { title: "Mail", subtitle: () => "" };

  return (
    <MessageListView
      messages={messages}
      title={cfg.title}
      subtitle={cfg.subtitle(messages.length, unreadCount)}
      loading={loading}
    />
  );
}
