import type { RelayPool } from "@post/nostr-core";
import { decryptEvent, createKeyStore, parseMessagePayloadAndUnwrap, extractSubject } from "@post/nostr-core";
import type { Message } from "@post/nostr-core";
import { nip17 } from "nostr-tools";
import type { NostrEvent } from "nostr-tools";
import { decode } from "nostr-tools/nip19";
import { db, addEdge, ensureConversation, EDGE } from "./db/poly";
import { useMessagesStore } from "./stores/messages";
import { useRelaysStore } from "./stores/relays";
import { useGroupsStore } from "./stores/groups";

let unsubscribe: (() => void) | null = null;
let groupResubscribe: (() => void) | null = null;

function buildMessage(
  source: { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] },
  identity: { pubkey: string },
  body: string,
  subject: string | undefined,
  attachments: Message["attachments"],
  isGiftWrapped: boolean,
  conversationId?: string | null,
  recipientPubkey?: string,
): Message {
  return {
    id: source.id,
    kind: source.kind,
    pubkey: source.pubkey,
    recipientPubkey: recipientPubkey ?? identity.pubkey,
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
    conversationId: conversationId ?? source.tags.find((t) => t[0] === "conversation")?.[1] ?? null,
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

async function saveGroupKeyIfPresent(parsed: { groupKey: { pubkey: string; privkey: string } | undefined; conversationId: string | undefined }, rumorTags: string[][]) {
  if (parsed.groupKey && parsed.conversationId) {
    const members = rumorTags
      .filter((t) => t[0] === "p")
      .map((t) => ({ pubkey: t[1], npub: "", name: t[1].slice(0, 12), avatarUrl: "", isGroup: false }));
    await useGroupsStore.getState().saveReceivedGroupKey(
      parsed.conversationId,
      parsed.groupKey.pubkey,
      parsed.groupKey.privkey,
      members,
    );
    await resubscribeGroupPubkeys();
  }
}

export async function resubscribeGroupPubkeys() {
  if (!groupResubscribe) return;
  groupResubscribe();
  groupResubscribe = null;
  const pool = useRelaysStore.getState().pool;
  if (!pool) return;
  const keyStore = createKeyStore();
  const identity = await keyStore.load();
  if (!identity?.pubkey) return;
  const groupPubkeys = useGroupsStore.getState().getAllGroupPubkeys();
  if (groupPubkeys.length === 0) return;
  groupResubscribe = pool.subscribe(
    [{ kinds: [14, 1059], "#p": groupPubkeys, limit: 100 }],
    async (event) => {
      if (event.kind === 1059) {
        await handleKind1059(event, identity);
      } else {
        await handleKind14(event, identity);
      }
    }
  );
}

async function handleKind14(event: NostrEvent, identity: { pubkey: string }) {
  try {
    const keyStore = createKeyStore();
    const plaintext = await decryptEvent(event, keyStore);
    const sk = await loadSk();
    const parsed = sk
      ? parseMessagePayloadAndUnwrap(plaintext, sk, event.pubkey)
      : { body: plaintext, subject: undefined, attachments: [], conversationId: undefined, groupKey: undefined };
    const { body, subject, attachments, conversationId } = parsed;
    const msg = buildMessage(event, identity, body, subject, attachments, false, conversationId);

    await saveGroupKeyIfPresent(parsed, event.tags);

    useMessagesStore.getState().ingestFromRelay(msg);
    await db.messages.put(msg);
    if (msg.replyTo) await addEdge(msg.id, EDGE.REPLIES_TO, msg.replyTo);
    if (msg.conversationId) {
      await ensureConversation(msg.conversationId);
      await addEdge(msg.id, EDGE.PART_OF, msg.conversationId);
    }
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

    let rumor: { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] };
    let isGroup = false;
    let groupPubkey: string | undefined;

    try {
      rumor = nip17.unwrapEvent(event, sk) as unknown as { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] };
    } catch {
      const result = useGroupsStore.getState().tryDecrypt(event);
      if (!result) return;
      rumor = result.rumor;
      isGroup = true;
      groupPubkey = event.tags.find((t) => t[0] === "p")?.[1];
    }

    const unwrapSk = isGroup && groupPubkey
      ? (() => {
          const group = useGroupsStore.getState().byPubkey[groupPubkey];
          if (!group) return sk;
          const bytes = new Uint8Array(group.privkey.length / 2);
          for (let i = 0; i < group.privkey.length; i += 2) bytes[i / 2] = parseInt(group.privkey.slice(i, i + 2), 16);
          return bytes;
        })()
      : sk;
    const { body, subject, attachments, conversationId, groupKey } = parseMessagePayloadAndUnwrap(rumor.content, unwrapSk, rumor.pubkey);
    const msg = buildMessage(
      { ...rumor, kind: 1059 },
      identity,
      body,
      subject,
      attachments,
      true,
      conversationId,
      isGroup ? groupPubkey : undefined,
    );

    await saveGroupKeyIfPresent({ groupKey, conversationId }, rumor.tags);

    useMessagesStore.getState().ingestFromRelay(msg);
    await db.messages.put(msg);
    if (msg.replyTo) await addEdge(msg.id, EDGE.REPLIES_TO, msg.replyTo);
    if (msg.conversationId) {
      await ensureConversation(msg.conversationId);
      await addEdge(msg.id, EDGE.PART_OF, msg.conversationId);
    }
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

  await useGroupsStore.getState().loadFromCache();
  const groupPubkeys = useGroupsStore.getState().getAllGroupPubkeys();
  const pFilter = [identity.pubkey, ...groupPubkeys];
  if (pFilter.length === 0) return;

  unsubscribe = pool.subscribe(
    [{ kinds: [14, 1059], "#p": pFilter, limit: 100 }],
    async (event) => {
      if (event.kind === 1059) {
        await handleKind1059(event, identity);
      } else {
        await handleKind14(event, identity);
      }
    }
  );

  groupResubscribe = () => {}; // dummy to allow resubscribe to call it

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
  if (groupResubscribe) {
    groupResubscribe();
    groupResubscribe = null;
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
