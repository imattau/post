"use client";

import { useParams } from "next/navigation";
import { useMessagesStore } from "@/lib/stores/messages";
import { useLabelsStore } from "@/lib/stores/labels";
import { useMemo } from "react";
import MessageListView from "../../_components/MessageListView";
import type { MockMessage, MockContact } from "@/lib/mock/threads";

export default function LabelPage() {
  const params = useParams();
  const labelId = params.label as string;
  const byId = useMessagesStore((s) => s.byId);
  const ids = useMessagesStore((s) => s.ids);
  const label = useLabelsStore((s) => s.byId[labelId]);

  const messages = useMemo(() => {
    if (!label) return [];
    return ids
      .map((id) => byId[id])
      .filter((m): m is NonNullable<typeof m> => m != null && m.labelIds.includes(labelId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(realToMock);
  }, [byId, ids, label, labelId]);

  return (
    <MessageListView
      messages={messages}
      title={label?.name ?? "Label"}
      subtitle={`${messages.length} messages`}
    />
  );
}

function realToMock(real: {
  id: string; pubkey: string; subject: string; preview: string; content: string;
  createdAt: number; read: boolean; starred: boolean;
}): MockMessage {
  return {
    id: real.id,
    sender: { id: real.pubkey, name: real.pubkey.slice(0, 8), npub: "", avatarInitials: real.pubkey.slice(0, 2).toUpperCase(), verified: false },
    recipientName: "me",
    subject: real.subject || "(no subject)",
    preview: real.preview || real.content.slice(0, 120),
    body: real.content,
    createdAt: real.createdAt,
    read: real.read,
    starred: real.starred,
    labels: [],
    attachments: [],
    encrypted: true,
    relayCount: 3,
    threadLength: 1,
  };
}
