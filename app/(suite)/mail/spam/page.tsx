"use client";

import { useMailboxMessages } from "../_components/useMailboxMessages";
import MessageListView from "../_components/MessageListView";

export default function SpamPage() {
  const { messages } = useMailboxMessages("spam");
  return (
    <MessageListView
      messages={messages}
      title="Spam"
      subtitle="Spam messages"
    />
  );
}
