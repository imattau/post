import type { RelayPool } from "@post/nostr-core";
import { decryptEvent } from "@post/nostr-core";
import type { Message } from "@post/nostr-core";
import { db } from "./db/schema";
import { useMessagesStore } from "./stores/messages";
import { useRelaysStore } from "./stores/relays";

let unsubscribe: (() => void) | null = null;

export function startSync() {
  const pool = useRelaysStore.getState().pool;
  if (!pool) return;

  const identity = (() => {
    try {
      const raw = localStorage.getItem("nostr-identity");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  if (!identity?.pubkey) return;

  stopSync();

  unsubscribe = pool.subscribe(
    [{ kinds: [14], "#p": [identity.pubkey], limit: 100 }],
    async (event) => {
      try {
        const { createKeyStore } = await import("@post/nostr-core");
        const keyStore = createKeyStore();
        const plaintext = await decryptEvent(event, keyStore);
        const msg: Message = {
          id: event.id,
          kind: event.kind,
          pubkey: event.pubkey,
          recipientPubkey: identity.pubkey,
          content: plaintext,
          raw: event.content,
          createdAt: event.created_at,
          tags: event.tags,
          subject: extractSubject(event, plaintext),
          preview: plaintext.replace(/\n/g, " ").slice(0, 120),
          read: false,
          starred: false,
          archived: false,
          snoozedUntil: null,
          spam: false,
          mailbox: "inbox",
          labelIds: [],
          replyTo: event.tags.find((t) => t[0] === "e")?.[1] ?? null,
          relayUrls: [],
          attachments: [],
          isEncrypted: true,
          isGiftWrapped: false,
          deliveryStatus: "delivered",
        };

        useMessagesStore.getState().ingestFromRelay(msg);
        await db.messages.put(msg);
      } catch {
        // Skip events that fail to decrypt
      }
    }
  );
}

export function stopSync() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

function extractSubject(event: { tags: string[][] }, plaintext: string): string {
  const subjectTag = event.tags.find((t) => t[0] === "subject");
  if (subjectTag?.[1]) return subjectTag[1];
  const lines = plaintext.split("\n").filter(Boolean);
  return lines[0]?.slice(0, 80) ?? "(no subject)";
}

export async function loadCachedMessages(): Promise<void> {
  const messages = await db.messages.orderBy("createdAt").reverse().toArray();
  if (messages.length === 0) return;

  const byId: Record<string, Message> = {};
  const ids: string[] = [];
  for (const m of messages) {
    byId[m.id] = m;
    ids.push(m.id);
  }
  useMessagesStore.setState({ byId, ids, loading: false });
}

export function searchMessages(query: string): Message[] {
  const { byId, ids } = useMessagesStore.getState();
  if (!query.trim()) return ids.map((id) => byId[id]).filter(Boolean);

  const lower = query.toLowerCase();
  return ids
    .map((id) => byId[id])
    .filter((m): m is Message => {
      if (!m) return false;
      return (
        m.subject.toLowerCase().includes(lower) ||
        m.content.toLowerCase().includes(lower) ||
        m.preview.toLowerCase().includes(lower) ||
        m.pubkey.toLowerCase().includes(lower)
      );
    });
}

export function getMailboxMessages(mailbox: string): Message[] {
  const { byId, ids } = useMessagesStore.getState();
  return ids
    .map((id) => byId[id])
    .filter((m): m is Message => {
      if (!m) return false;
      switch (mailbox) {
        case "inbox":
          return !m.archived && !m.spam && m.snoozedUntil === null;
        case "starred":
          return m.starred;
        case "snoozed":
          return m.snoozedUntil !== null && m.snoozedUntil > Date.now();
        case "sent":
          return m.pubkey === identityPubkey();
        case "archive":
          return m.archived;
        case "spam":
          return m.spam;
        default:
          return true;
      }
    });
}

function identityPubkey(): string {
  try {
    const raw = localStorage.getItem("nostr-identity");
    if (!raw) return "";
    return JSON.parse(raw).pubkey ?? "";
  } catch {
    return "";
  }
}
