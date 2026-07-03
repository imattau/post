"use client";

import { useParams } from "next/navigation";
import { useMessagesStore } from "@/lib/stores/messages";
import { useLabelsStore } from "@/lib/stores/labels";
import { useMemo } from "react";
import MessageListView from "../../_components/MessageListView";
import { realToMock } from "../../_components/useMailboxMessages";

export default function LabelPage() {
  const params = useParams();
  const labelId = params.label as string;
  const byId = useMessagesStore((s) => s.byId);
  const ids = useMessagesStore((s) => s.ids);
  const label = useLabelsStore((s) => s.byId[labelId]);
  const labels = useLabelsStore((s) => s.byId);

  const messages = useMemo(() => {
    if (!label) return [];
    return ids
      .map((id) => byId[id])
      .filter((m): m is NonNullable<typeof m> => m != null && m.labelIds.includes(labelId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((message) => realToMock(message, labels));
  }, [byId, ids, label, labelId, labels]);

  return (
    <MessageListView
      messages={messages}
      title={label?.name ?? "Label"}
      subtitle={`${messages.length} messages`}
    />
  );
}
