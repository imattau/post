import type { RelayPool } from "@post/nostr-core";
import { decryptEvent, createKeyStore } from "@post/nostr-core";
import type { Message } from "@post/nostr-core";
import { db } from "./db/schema";
import { useMessagesStore } from "./stores/messages";
import { useRelaysStore } from "./stores/relays";

let unsubscribe: (() => void) | null = null;

import type { NostrEvent } from "nostr-tools";

async function handleKind14(event: NostrEvent, identity: { pubkey: string }) {
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

async function handleKind1059(event: NostrEvent, identity: { pubkey: string }) {
  try {
    const { createKeyStore } = await import("@post/nostr-core");
    const keyStore = createKeyStore();
    const storedIdentity = keyStore.load();
    if (!storedIdentity?.nsec) return;

    const { decode } = await import("nostr-tools/nip19");
    const nsecDecoded = decode(storedIdentity.nsec);
    if (nsecDecoded.type !== "nsec") return;
    const sk = nsecDecoded.data;

    const { nip17 } = await import("nostr-tools");
    const rumor = nip17.unwrapEvent(event, sk) as unknown as { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] };

    const plaintext = rumor.content;
    const msg: Message = {
      id: event.id,
      kind: 1059,
      pubkey: rumor.pubkey,
      recipientPubkey: identity.pubkey,
      content: plaintext,
      raw: event.content,
      createdAt: rumor.created_at,
      tags: rumor.tags,
      subject: extractSubject(rumor, plaintext),
      preview: plaintext.replace(/\n/g, " ").slice(0, 120),
      read: false,
      starred: false,
      archived: false,
      snoozedUntil: null,
      spam: false,
      mailbox: "inbox",
      labelIds: [],
      replyTo: rumor.tags.find((t) => t[0] === "e")?.[1] ?? null,
      relayUrls: [],
      attachments: [],
      isEncrypted: true,
      isGiftWrapped: true,
      deliveryStatus: "delivered",
    };

    useMessagesStore.getState().ingestFromRelay(msg);
    await db.messages.put(msg);
  } catch {
    // Skip events that fail to decrypt
  }
}

export function startSync() {
  const pool = useRelaysStore.getState().pool;
  if (!pool) return;

  const keyStore = createKeyStore();
  const identity = keyStore.load();

  if (!identity?.pubkey) return;

  stopSync();

  unsubscribe = pool.subscribe(
    [{ kinds: [14, 1059], "#p": [identity.pubkey], limit: 100 }],
    async (event) => {
      if (event.kind === 1059) {
        await handleKind1059(event, identity);
      } else {
        await handleKind14(event, identity);
      }
    }
  );

  pool.subscribe(
    [{ kinds: [5], authors: [identity.pubkey], limit: 50 }],
    async (event) => {
      for (const tag of event.tags) {
        if (tag[0] === "e") {
          const deletedId = tag[1];
          const msg = useMessagesStore.getState().byId[deletedId];
          if (msg) {
            await useMessagesStore.getState().deleteMessage(deletedId);
          }
        }
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



