import MessageListView from "../_components/MessageListView";

export default function SnoozedPage() {
  return (
    <MessageListView
      messages={[]}
      title="Snoozed"
      subtitle="No snoozed messages"
    />
  );
}
