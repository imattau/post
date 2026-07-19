import type { RelayPool } from "@post/nostr-core";
import { decryptEvent, createKeyStore, parseMessagePayloadAndUnwrap, extractSubject } from "@post/nostr-core";
import type { Message } from "@post/nostr-core";
import { nip17 } from "nostr-tools";
import type { NostrEvent } from "nostr-tools";
import { decode } from "nostr-tools/nip19";
import { db } from "./db/schema";
import { useMessagesStore } from "./stores/messages";
import { useRelaysStore } from "./stores/relays";

let unsubscribe: (() => void) | null = null;

function buildMessage(
  source: { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] },
  identity: { pubkey: string },
  body: string,
  subject: string | undefined,
  attachments: Message["attachments"],
  isGiftWrapped: boolean,
): Message {
  return {
    id: source.id,
    kind: source.kind,
    pubkey: source.pubkey,
    recipientPubkey: identity.pubkey,
    content: body,
    raw: source.content,
    createdAt: source.created_at,
    tags: source.tags,
    subject: subject ?? extractSubject({ tags: source.tags, content: source.content } as any),
    preview: body.replace(/\n/g, " ").slice(0, 120),
    read: false,
    starred: false,
    archived: false,
    snoozedUntil: null,
    spam: false,
    mailbox: "inbox",
    labelIds: [],
    replyTo: source.tags.find((t) => t[0] === "e")?.[1] ?? null,
    relayUrls: [],
    attachments,
    isEncrypted: true,
    isGiftWrapped,
    deliveryStatus: "delivered",
  };
}

async function loadSk(): Promise<Uint8Array | null> {
  const keyStore = createKeyStore();
  const identity = await keyStore.load();
  if (!identity?.nsec) return null;
  const decoded = decode(identity.nsec);
  if (decoded.type !== "nsec") return null;
  return decoded.data;
}

async function handleKind14(event: NostrEvent, identity: { pubkey: string }) {
  try {
    const keyStore = createKeyStore();
    const plaintext = await decryptEvent(event, keyStore);
    const sk = await loadSk();
    const { body, subject, attachments } = sk
      ? parseMessagePayloadAndUnwrap(plaintext, sk, event.pubkey)
      : { body: plaintext, subject: undefined, attachments: [] };
    const msg = buildMessage(event, identity, body, subject, attachments, false);

    useMessagesStore.getState().ingestFromRelay(msg);
    await db.messages.put(msg);
  } catch {
    // Skip events that fail to decrypt
  }
}

async function handleKind1059(event: NostrEvent, identity: { pubkey: string }) {
  try {
    const storedIdentity = await createKeyStore().load();
    if (!storedIdentity?.nsec) return;

    const nsecDecoded = decode(storedIdentity.nsec);
    if (nsecDecoded.type !== "nsec") return;
    const sk = nsecDecoded.data as Uint8Array;

    const rumor = nip17.unwrapEvent(event, sk) as unknown as { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] };

    const { body, subject, attachments } = parseMessagePayloadAndUnwrap(rumor.content, sk, rumor.pubkey);
    const msg = buildMessage({ ...rumor, kind: 1059 }, identity, body, subject, attachments, true);

    useMessagesStore.getState().ingestFromRelay(msg);
    await db.messages.put(msg);
  } catch {
    // Skip events that fail to decrypt
  }
}

export async function startSync() {
  const pool = useRelaysStore.getState().pool;
  if (!pool) return;

  const keyStore = createKeyStore();
  const identity = await keyStore.load();

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



