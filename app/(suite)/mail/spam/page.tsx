import MessageListView from "../_components/MessageListView";

export default function SpamPage() {
  return (
    <MessageListView
      messages={[]}
      title="Spam"
      subtitle="No spam messages"
    />
  );
}
