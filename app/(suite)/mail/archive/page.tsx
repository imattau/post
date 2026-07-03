"use client";

import { useMailboxMessages } from "../_components/useMailboxMessages";
import MessageListView from "../_components/MessageListView";

export default function ArchivePage() {
  const { messages } = useMailboxMessages("archive");
  return (
    <MessageListView
      messages={messages}
      title="Archive"
      subtitle="Archived messages"
    />
  );
}
