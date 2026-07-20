"use client";

import { useParams } from "next/navigation";
import { graph, EDGE } from "@/lib/db/poly";
import { useMessagesStore } from "@/lib/stores/messages";
import { useLabelsStore } from "@/lib/stores/labels";
import { useProfilesStore } from "@/lib/stores/profiles";
import { useIdentityStore } from "@/lib/stores/identity";
import { useMemo, useEffect } from "react";
import type { Message } from "@post/nostr-core";
import MessageListView from "../../_components/MessageListView";
import { realToMock } from "../../_components/useMailboxMessages";

export default function LabelPageClient() {
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
    const msgIds = graph.getEdgeSources(labelId, EDGE.HAS_LABEL);
    const msgs = msgIds.map((id) => byId[id]).filter(Boolean) as Message[];
    const pubkeys = msgs.flatMap((m) => [m.pubkey, m.recipientPubkey]);
    const unique = [...new Set(pubkeys)];
    if (unique.length > 0) batchFetchProfiles(unique);
  }, [byId, ids, labelId, batchFetchProfiles]);

  const messages = useMemo(() => {
    if (!label) return [];
    const msgIds = new Set(graph.getEdgeSources(labelId, EDGE.HAS_LABEL));
    return ids
      .map((id) => byId[id])
      .filter((m): m is NonNullable<typeof m> => m != null && msgIds.has(m.id))
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
