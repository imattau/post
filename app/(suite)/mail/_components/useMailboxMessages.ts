import { useMessagesStore } from "@/lib/stores/messages";
import { useLabelsStore } from "@/lib/stores/labels";
import { useProfilesStore } from "@/lib/stores/profiles";
import { useMemo, useEffect } from "react";
import type { MockMessage, MockContact } from "@/lib/mock/threads";
import type { AttachmentRef } from "@/lib/types";
import type { Profile } from "@post/nostr-core";

export function useMailboxMessages(mailbox: string): {
  messages: MockMessage[];
  unreadCount: number;
} {
  const byId = useMessagesStore((s) => s.byId);
  const ids = useMessagesStore((s) => s.ids);
  const labels = useLabelsStore((s) => s.byId);
  const profiles = useProfilesStore((s) => s.byPubkey);
  const batchFetchProfiles = useProfilesStore((s) => s.batchFetchProfiles);

  useEffect(() => {
    if (ids.length > 0) {
      const pubkeys = ids.map((id) => byId[id]).filter(Boolean).map((m) => m!.pubkey);
      const unique = [...new Set(pubkeys)];
      batchFetchProfiles(unique);
    }
  }, [ids, byId, batchFetchProfiles]);

  return useMemo(() => {
    if (ids.length > 0) {
      const filtered = ids
        .map((id) => byId[id])
        .filter((m): m is NonNullable<typeof m> => m != null)
        .filter((m) => {
          switch (mailbox) {
            case "inbox":
              return !m.archived && !m.spam && m.snoozedUntil === null;
            case "starred":
              return m.starred;
            case "snoozed":
              return m.snoozedUntil !== null && m.snoozedUntil > Date.now();
            case "archive":
              return m.archived;
            case "spam":
              return m.spam;
            case "sent":
              return m.mailbox === "sent";
            case "drafts":
              return false;
            default:
              return true;
          }
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      const asMock = filtered.map((m) => realToMock(m, labels, profiles));
      return {
        messages: asMock,
        unreadCount: filtered.filter((m) => !m.read).length,
      };
    }

    const { MESSAGES } = require("@/lib/mock/threads") as { MESSAGES: MockMessage[] };
    return {
      messages: MESSAGES,
      unreadCount: MESSAGES.filter((m) => !m.read).length,
    };
  }, [byId, ids, labels, mailbox, profiles]);
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
  },
  labels: Record<string, { name: string }> = {},
  profiles: Record<string, Profile> = {}
): MockMessage {
  const profile = profiles[real.pubkey];
  const displayName = profile?.name || profile?.displayName || real.pubkey.slice(0, 8);
  const initials = profile?.name
    ? profile.name.slice(0, 2).toUpperCase()
    : real.pubkey.slice(0, 2).toUpperCase();

  const contact: MockContact = {
    id: real.pubkey,
    name: displayName,
    npub: `${real.pubkey.slice(0, 10)}…`,
    avatarInitials: initials,
    verified: profile?.nip05 ? true : false,
  };

  return {
    id: real.id,
    sender: contact,
    recipientName: "me",
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
  };
}
