import MessageListView from "../_components/MessageListView";

export default function SentPage() {
  return (
    <MessageListView
      messages={[]}
      title="Sent"
      subtitle="No sent messages"
    />
  );
}
