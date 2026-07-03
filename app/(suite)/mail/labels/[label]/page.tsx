import MessageListView from "../../_components/MessageListView";

export default async function LabelPage({ params }: { params: Promise<{ label: string }> }) {
  const { label } = await params;
  return (
    <MessageListView
      messages={[]}
      title={`Label: ${label}`}
      subtitle={`Messages labeled "${label}"`}
    />
  );
}
