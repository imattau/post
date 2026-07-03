import { MESSAGES } from "@/lib/mock/threads";
import MessageListView from "../_components/MessageListView";

export default function StarredPage() {
  const starred = MESSAGES.filter((m) => m.starred);
  return (
    <MessageListView
      messages={starred}
      title="Starred"
      subtitle={`${starred.length} starred`}
    />
  );
}
