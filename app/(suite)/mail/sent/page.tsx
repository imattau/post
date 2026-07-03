"use client";

import { useMailboxMessages } from "../_components/useMailboxMessages";
import MessageListView from "../_components/MessageListView";

export default function SentPage() {
  const { messages } = useMailboxMessages("sent");
  return (
    <MessageListView
      messages={messages}
      title="Sent"
      subtitle="Sent messages"
    />
  );
}
