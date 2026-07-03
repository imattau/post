"use client";

import MessageListView from "../_components/MessageListView";

export default function DraftsPage() {
  return (
    <MessageListView
      messages={[]}
      title="Drafts"
      subtitle="Draft messages"
    />
  );
}
