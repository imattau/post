"use client";

import { useParams } from "next/navigation";
import { useMessagesStore } from "@/lib/stores/messages";
import { useLabelsStore } from "@/lib/stores/labels";
import { useProfilesStore } from "@/lib/stores/profiles";
import { useMemo, useEffect } from "react";
import MessageListView from "../../_components/MessageListView";
import { realToMock } from "../../_components/useMailboxMessages";

export default function LabelPage() {
  const params = useParams();
  const labelId = params.label as string;
  const byId = useMessagesStore((s) => s.byId);
  const ids = useMessagesStore((s) => s.ids);
  const label = useLabelsStore((s) => s.byId[labelId]);
  const labels = useLabelsStore((s) => s.byId);
  const profiles = useProfilesStore((s) => s.byPubkey);
  const batchFetchProfiles = useProfilesStore((s) => s.batchFetchProfiles);

  useEffect(() => {
    const pubkeys = ids
      .map((id) => byId[id])
      .filter((m): m is NonNullable<typeof m> => m != null && m.labelIds.includes(labelId))
      .map((m) => m.pubkey);
    const unique = [...new Set(pubkeys)];
    if (unique.length > 0) batchFetchProfiles(unique);
  }, [byId, ids, labelId, batchFetchProfiles]);

  const messages = useMemo(() => {
    if (!label) return [];
    return ids
      .map((id) => byId[id])
      .filter((m): m is NonNullable<typeof m> => m != null && m.labelIds.includes(labelId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((message) => realToMock(message, labels, profiles));
  }, [byId, ids, label, labelId, labels, profiles]);

  return (
    <MessageListView
      messages={messages}
      title={label?.name ?? "Label"}
      subtitle={`${messages.length} messages`}
    />
  );
}
