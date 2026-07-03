"use client";

import { useParams } from "next/navigation";
import MessageListView from "../../_components/MessageListView";

export default function LabelPage() {
  const params = useParams();
  const label = params.label as string;
  return (
    <MessageListView
      messages={[]}
      title={`Label: ${label}`}
      subtitle={`Messages labeled "${label}"`}
    />
  );
}
