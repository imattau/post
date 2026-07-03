import { MESSAGES } from "@/lib/mock/threads";
import MessageListView from "../_components/MessageListView";

export default function InboxPage() {
  const unreadCount = MESSAGES.filter((m) => !m.read).length;
  return (
    <MessageListView
      messages={MESSAGES}
      title="Inbox"
      subtitle={`${unreadCount} unread`}
    />
  );
}
