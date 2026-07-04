"use client";

import { useParams } from "next/navigation";
import { useMessagesStore } from "@/lib/stores/messages";
import { useLabelsStore } from "@/lib/stores/labels";
import { useProfilesStore } from "@/lib/stores/profiles";
import { useIdentityStore } from "@/lib/stores/identity";
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
  const myPubkey = useIdentityStore((s) => s.identity?.pubkey ?? null);

  useEffect(() => {
    const msgs = ids
      .map((id) => byId[id])
      .filter((m): m is NonNullable<typeof m> => m != null && m.labelIds.includes(labelId));
    const pubkeys = msgs.flatMap((m) => [m.pubkey, m.recipientPubkey]);
    const unique = [...new Set(pubkeys)];
    if (unique.length > 0) batchFetchProfiles(unique);
  }, [byId, ids, labelId, batchFetchProfiles]);

  const messages = useMemo(() => {
    if (!label) return [];
    return ids
      .map((id) => byId[id])
      .filter((m): m is NonNullable<typeof m> => m != null && m.labelIds.includes(labelId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((message) => realToMock(message, labels, profiles, myPubkey));
  }, [byId, ids, label, labelId, labels, profiles, myPubkey]);

  return (
    <MessageListView
      messages={messages}
      title={label?.name ?? "Label not found"}
      subtitle={label ? `${messages.length} messages` : "This label may have been deleted."}
    />
  );
}
