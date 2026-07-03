import MessageListView from "../_components/MessageListView";

export default function ArchivePage() {
  return (
    <MessageListView
      messages={[]}
      title="Archive"
      subtitle="No archived messages"
    />
  );
}
