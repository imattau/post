"use client";

import { useMailboxMessages } from "../_components/useMailboxMessages";
import MessageListView from "../_components/MessageListView";

export default function SnoozedPage() {
  const { messages } = useMailboxMessages("snoozed");
  return (
    <MessageListView
      messages={messages}
      title="Snoozed"
      subtitle="Snoozed messages"
    />
  );
}
