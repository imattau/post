import { useMessagesStore } from "@/lib/stores/messages";
import { useLabelsStore } from "@/lib/stores/labels";
import { useProfilesStore } from "@/lib/stores/profiles";
import { useComposeStore } from "@/lib/stores/compose";
import { useIdentityStore } from "@/lib/stores/identity";
import { useMemo, useEffect, useState } from "react";
import type { MockMessage, MockContact } from "@/lib/mock/threads";
import type { AttachmentRef, Draft } from "@/lib/types";
import type { Profile } from "@post/nostr-core";

function draftToMessage(draft: Draft): MockMessage {
  const recipientNames = draft.to.map((r) => r.name).join(", ") || "No recipient";
  return {
    id: draft.id,
    sender: {
      id: "me",
      name: "Me",
      npub: "",
      avatarInitials: "ME",
      verified: false,
    },
    recipientName: recipientNames,
    subject: draft.subject || "(no subject)",
    preview: draft.body || "Draft message",
    body: draft.body,
    createdAt: draft.updatedAt,
    read: true,
    starred: false,
    labels: [],
    attachments: draft.attachments
      .filter((upload) => upload.result)
      .map((upload) => upload.result!),
    encrypted: true,
    relayCount: draft.relayOverrides.length || 3,
    threadLength: 1,
  };
}

export function useMailboxMessages(mailbox: string): {
  messages: MockMessage[];
  unreadCount: number;
} {
  const byId = useMessagesStore((s) => s.byId);
  const ids = useMessagesStore((s) => s.ids);
  const labels = useLabelsStore((s) => s.byId);
  const profiles = useProfilesStore((s) => s.byPubkey);
  const batchFetchProfiles = useProfilesStore((s) => s.batchFetchProfiles);
  const myPubkey = useIdentityStore((s) => s.identity?.pubkey ?? null);

  const draftVersion = useComposeStore((s) => s.draftVersion);
  const [draftMessages, setDraftMessages] = useState<MockMessage[]>([]);

  useEffect(() => {
    if (mailbox !== "drafts") return;
    let active = true;
    (async () => {
      const drafts = await useComposeStore.getState().listDrafts();
      if (active) setDraftMessages(drafts.map(draftToMessage));
    })();
    return () => { active = false; };
  }, [mailbox, draftVersion]);

  useEffect(() => {
    if (ids.length > 0) {
      const msgs = ids.map((id) => byId[id]).filter(Boolean);
      const pubkeys = msgs.flatMap((m) => [m!.pubkey, m!.recipientPubkey]);
      const unique = [...new Set(pubkeys)];
      batchFetchProfiles(unique);
    }
  }, [ids, byId, batchFetchProfiles]);

  return useMemo(() => {
    if (mailbox === "drafts") {
      return { messages: draftMessages, unreadCount: draftMessages.length };
    }

    if (ids.length > 0) {
      const filtered = ids
        .map((id) => byId[id])
        .filter((m): m is NonNullable<typeof m> => m != null)
        .filter((m) => {
          switch (mailbox) {
            case "inbox":
              return !m.archived && !m.spam && m.snoozedUntil === null && (myPubkey === null || m.recipientPubkey === myPubkey);
            case "starred":
              return m.starred;
            case "snoozed":
              return m.snoozedUntil !== null && m.snoozedUntil > Date.now();
            case "archive":
              return m.archived;
            case "spam":
              return m.spam;
            case "sent":
              return m.mailbox === "sent" && (myPubkey === null || m.pubkey === myPubkey);
            default:
              return true;
          }
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      const asMock = filtered.map((m) => realToMock(m, labels, profiles, myPubkey));
      return {
        messages: asMock,
        unreadCount: filtered.filter((m) => !m.read).length,
      };
    }

    return { messages: [], unreadCount: 0 };
  }, [byId, ids, labels, mailbox, profiles, draftMessages, myPubkey]);
}

export function realToMock(
  real: {
    id: string;
    pubkey: string;
    recipientPubkey?: string;
    subject: string;
    preview: string;
    content: string;
    createdAt: number;
    read: boolean;
    starred: boolean;
    labelIds?: string[];
    attachments?: AttachmentRef[];
    isEncrypted?: boolean;
    relayUrls?: string[];
    deliveryStatus?: string;
  },
  labels: Record<string, { name: string }> = {},
  profiles: Record<string, Profile> = {},
  myPubkey: string | null = null
): MockMessage {
  const isSent = myPubkey !== null && real.pubkey === myPubkey;
  const targetPubkey = isSent ? (real.recipientPubkey ?? real.pubkey) : real.pubkey;
  const profile = profiles[targetPubkey];
  const displayName = profile?.name || profile?.displayName || targetPubkey.slice(0, 8);
  const initials = profile?.name
    ? profile.name.slice(0, 2).toUpperCase()
    : targetPubkey.slice(0, 2).toUpperCase();

  const contact: MockContact = {
    id: targetPubkey,
    name: isSent ? "Me" : displayName,
    npub: isSent ? "" : `${targetPubkey.slice(0, 10)}…`,
    avatarInitials: isSent ? "ME" : initials,
    verified: isSent ? false : (profile?.nip05 ? true : false),
  };

  const recipientName = isSent ? displayName : "me";

  return {
    id: real.id,
    sender: contact,
    recipientName,
    subject: real.subject || "(no subject)",
    preview: real.preview || real.content.slice(0, 120),
    body: real.content,
    createdAt: real.createdAt,
    read: real.read,
    starred: real.starred,
    labels: (real.labelIds ?? []).map((id) => labels[id]?.name ?? id),
    attachments: real.attachments ?? [],
    encrypted: real.isEncrypted ?? true,
    relayCount: real.relayUrls?.length ?? 3,
    threadLength: 1,
    deliveryStatus: (real as any).deliveryStatus as MockMessage["deliveryStatus"],
  };
}
