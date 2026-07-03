"use client";

import { useMailboxMessages } from "../_components/useMailboxMessages";
import MessageListView from "../_components/MessageListView";

export default function StarredPage() {
  const { messages } = useMailboxMessages("starred");
  return (
    <MessageListView
      messages={messages}
      title="Starred"
      subtitle={`${messages.length} starred`}
    />
  );
}
