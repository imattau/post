"use client";

import { useMailboxMessages } from "../_components/useMailboxMessages";
import MessageListView from "../_components/MessageListView";

export default function InboxPage() {
  const { messages, unreadCount } = useMailboxMessages("inbox");
  return (
    <MessageListView
      messages={messages}
      title="Inbox"
      subtitle={`${unreadCount} unread`}
    />
  );
}
