import { nip44, nip59, finalizeEvent } from "nostr-tools";
import { decode } from "nostr-tools/nip19";
import { generateSecretKey, getPublicKey, getEventHash } from "nostr-tools/pure";
import type { NostrEvent } from "nostr-tools";
import type { RelayPool } from "./relays";
import type { KeyStore } from "./keys";
import type { Message, AttachmentRef } from "./types";
import { wrapFileKey, unwrapFileKey, fromBase64Key, toBase64Key } from "./attachments";

type Event = NostrEvent;

export interface SendOptions {
  to: string;
  content: string;
  subject?: string;
  attachments?: AttachmentRef[];
  replyTo?: string;
  conversationId?: string;
  groupPubkey?: string;
  groupMembers?: string[];
  groupKey?: { pubkey: string; privkey: string };
  relayOverrides?: string[];
  giftWrap?: boolean;
}

export interface SendResult {
  eventId: string;
  published: Map<string, boolean>;
  delivered: number;
}

export interface SignerKey {
  pubkey: string;
  signEvent(event: { kind: number; tags: string[][]; content: string; created_at: number }): Promise<{ sig: string }>;
  nip44Encrypt(recipientPubkey: string, plaintext: string): Promise<string>;
}

function buildMessagePayload(content: string, subject: string | undefined, attachments: AttachmentRef[] | undefined, sk: Uint8Array | null, to: string, conversationId?: string, groupKey?: { pubkey: string; privkey: string }): string {
  if (!attachments?.length && !subject && !conversationId && !groupKey) return content;

  const payload: Record<string, any> = { body: content, v: 1 };

  if (attachments?.length) {
    payload.attachments = attachments.map((att) => {
      const encryptedKey = att.encrypted && att.fileKey && sk
        ? wrapFileKey(fromBase64Key(att.fileKey), sk, to)
        : undefined;
      return {
        fileName: att.fileName,
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes,
        sha256: att.sha256,
        url: att.url,
        encryptedKey,
        fileIv: att.fileIv,
      };
    });
  }

  if (subject) payload.subject = subject;
  if (conversationId) payload.conversationId = conversationId;
  if (groupKey) payload.groupKey = groupKey;

  return JSON.stringify(payload);
}

export function parseMessagePayloadAndUnwrap(plaintext: string, sk: Uint8Array, senderPubkey: string): {
  body: string;
  subject: string | undefined;
  attachments: AttachmentRef[];
  conversationId: string | undefined;
  groupKey: { pubkey: string; privkey: string } | undefined;
} {
  try {
    const parsed = JSON.parse(plaintext);
    if (parsed && typeof parsed === "object" && parsed.v === 1) {
      const attachments: AttachmentRef[] = (parsed.attachments || []).map((att: any) => {
        const ref: AttachmentRef = {
          id: att.sha256 ?? att.url,
          fileName: att.fileName || "Untitled",
          mimeType: att.mimeType || "application/octet-stream",
          sizeBytes: att.sizeBytes || 0,
          sha256: att.sha256,
          url: att.url,
          storedInDrive: false,
          encrypted: false,
        };
        if (att.encryptedKey && att.fileIv) {
          try {
            const fileKey = unwrapFileKey(att.encryptedKey, sk, senderPubkey);
            ref.encrypted = true;
            ref.fileIv = att.fileIv;
            ref.fileKey = toBase64Key(fileKey);
          } catch {
            // Key doesn't apply to this recipient — skip
          }
        }
        return ref;
      });
      return { body: parsed.body || "", subject: parsed.subject, attachments, conversationId: parsed.conversationId, groupKey: parsed.groupKey };
    }
  } catch {
    // Not JSON format — treat as plain text
  }
  return { body: plaintext, subject: undefined, attachments: [], conversationId: undefined, groupKey: undefined };
}

function isSignerKey(keys: KeyStore | SignerKey): keys is SignerKey {
  return "signEvent" in keys;
}

async function signEventWithNsec(template: { kind: number; tags: string[][]; content: string; created_at: number }, sk: Uint8Array): Promise<Event> {
  return finalizeEvent(template, sk) as Event;
}

async function signEventWithSigner(
  template: { kind: number; tags: string[][]; content: string; created_at: number },
  signer: SignerKey
): Promise<Event> {
  const signed = await signer.signEvent(template);
  const id = getEventHash({ ...template, pubkey: signer.pubkey } as any);
  return { ...template, pubkey: signer.pubkey, sig: signed.sig, id } as unknown as Event;
}

async function nip44Encrypt(payload: string, sk: Uint8Array, to: string): Promise<string> {
  const conversationKey = nip44.v2.utils.getConversationKey(sk, to);
  return nip44.v2.encrypt(payload, conversationKey);
}

async function nip44EncryptWithSigner(payload: string, signer: SignerKey, to: string): Promise<string> {
  return signer.nip44Encrypt(to, payload);
}

async function wrapEventNsec(rumor: { kind: number; content: string; created_at: number; tags: string[][] }, sk: Uint8Array, recipientPubkey: string): Promise<Event> {
  return nip59.wrapEvent(rumor, sk, recipientPubkey) as Event;
}

async function wrapEventWithSigner(
  rumor: { kind: number; content: string; created_at: number; tags: string[][] },
  signer: SignerKey,
  recipientPubkey: string
): Promise<Event> {
  const rumorWithPubkey = { ...rumor, pubkey: signer.pubkey };
  const rumorJson = JSON.stringify(rumorWithPubkey);
  const sealContent = await signer.nip44Encrypt(recipientPubkey, rumorJson);
  const sealTemplate = { kind: 13, content: sealContent, created_at: Math.floor(Date.now() / 1000), tags: [] };
  const sealEvent = await signEventWithSigner(sealTemplate, signer);

  const randomKey = generateSecretKey();
  const sealJson = JSON.stringify(sealEvent);
  const randomPubkey = getPublicKey(randomKey);
  const conversationKey = nip44.v2.utils.getConversationKey(randomKey, recipientPubkey);
  const wrapContent = nip44.v2.encrypt(sealJson, conversationKey);
  const wrapTemplate = { kind: 1059, content: wrapContent, created_at: Math.floor(Date.now() / 1000), tags: [["p", recipientPubkey]] };
  return finalizeEvent(wrapTemplate, randomKey) as Event;
}

export async function sendMessage(
  pool: RelayPool,
  keys: KeyStore | SignerKey,
  opts: SendOptions
): Promise<SendResult> {
  const useSigner = isSignerKey(keys);
  let pubkey: string;
  let sk: Uint8Array | null = null;
  let signer: SignerKey | null = null;

  if (useSigner) {
    signer = keys;
    pubkey = keys.pubkey;
  } else {
    const identity = await keys.load();
    if (!identity || !identity.nsec) throw new Error("Cannot send message");
    const nsecDecoded = decode(identity.nsec);
    if (nsecDecoded.type !== "nsec") throw new Error("Cannot send message");
    sk = nsecDecoded.data;
    pubkey = identity.pubkey;
  }

  const encrypt = useSigner
    ? (payload: string, to: string) => nip44EncryptWithSigner(payload, signer!, to)
    : (payload: string, to: string) => nip44Encrypt(payload, sk!, to);

  const sign = useSigner
    ? (template: { kind: number; tags: string[][]; content: string; created_at: number }) => signEventWithSigner(template, signer!)
    : (template: { kind: number; tags: string[][]; content: string; created_at: number }) => signEventWithNsec(template, sk!);

  const wrap = useSigner
    ? (rumor: { kind: number; content: string; created_at: number; tags: string[][] }, to: string) => wrapEventWithSigner(rumor, signer!, to)
    : (rumor: { kind: number; content: string; created_at: number; tags: string[][] }, to: string) => wrapEventNsec(rumor, sk!, to);

  let event: NostrEvent;

  if (opts.groupPubkey) {
    const payload = buildMessagePayload(opts.content, opts.subject, opts.attachments, sk, opts.groupPubkey, opts.conversationId, opts.groupKey);
    const rumorTags: string[][] = [["p", opts.groupPubkey]];
    if (opts.groupMembers) {
      for (const pk of opts.groupMembers) {
        if (pk !== opts.groupPubkey) rumorTags.push(["p", pk]);
      }
    }
    if (opts.subject) rumorTags.push(["subject", opts.subject]);
    if (opts.replyTo) rumorTags.push(["e", opts.replyTo]);
    if (opts.conversationId) rumorTags.push(["conversation", opts.conversationId]);

    const rumorEvent = {
      kind: 14,
      content: payload,
      created_at: Math.floor(Date.now() / 1000),
      tags: rumorTags,
    };
    event = await wrap(rumorEvent, opts.groupPubkey);
  } else {
    const baseTags: string[][] = [["p", opts.to]];
    if (opts.subject) baseTags.push(["subject", opts.subject]);
    if (opts.replyTo) baseTags.push(["e", opts.replyTo]);
    if (opts.conversationId) baseTags.push(["conversation", opts.conversationId]);

    if (opts.giftWrap) {
      const payload = buildMessagePayload(opts.content, opts.subject, opts.attachments, sk, opts.to, opts.conversationId, opts.groupKey);
      const rumorEvent = {
        kind: 14,
        content: payload,
        created_at: Math.floor(Date.now() / 1000),
        tags: baseTags,
      };
      event = await wrap(rumorEvent, opts.to);
    } else {
      const payload = buildMessagePayload(opts.content, opts.subject, opts.attachments, sk, opts.to, opts.conversationId, opts.groupKey);
      const encrypted = await encrypt(payload, opts.to);
      const eventTemplate = {
        kind: 14,
        content: encrypted,
        created_at: Math.floor(Date.now() / 1000),
        tags: baseTags,
      };
      event = await sign(eventTemplate);
    }
  }

  let published: Map<string, boolean>;
  try {
    published = await pool.publish(event, opts.relayOverrides);
  } catch (err) {
    console.error("sendMessage publish error:", err);
    published = new Map();
  }
  let delivered = 0;
  for (const ok of published.values()) if (ok) delivered++;

  return {
    eventId: event.id,
    published,
    delivered,
  };
}

export async function replyToThread(
  pool: RelayPool,
  keys: KeyStore,
  rootEventId: string,
  recipientPubkey: string,
  content: string,
  attachments?: AttachmentRef[]
): Promise<SendResult> {
  return sendMessage(pool, keys, {
    to: recipientPubkey,
    content,
    attachments,
    replyTo: rootEventId,
  });
}

export async function decryptEvent(
  event: Event,
  keys: KeyStore
): Promise<string> {
  const identity = await keys.load();
  if (!identity || !identity.nsec) throw new Error("Cannot decrypt message");

  const nsecDecoded = decode(identity.nsec);
  if (nsecDecoded.type !== "nsec") throw new Error("Cannot decrypt message");
  const sk = nsecDecoded.data;

  const conversationKey = nip44.v2.utils.getConversationKey(sk, event.pubkey);
  return nip44.v2.decrypt(event.content, conversationKey);
}

export function extractSubject(event: Event): string {
  const subjectTag = event.tags.find((t) => t[0] === "subject");
  if (subjectTag?.[1]) return subjectTag[1];
  const lines = event.content.split("\n").filter(Boolean);
  return lines[0]?.slice(0, 80) ?? "(no subject)";
}

function extractPreview(content: string): string {
  return content.replace(/\n/g, " ").slice(0, 120);
}

export async function decryptIncoming(
  pool: RelayPool,
  keys: KeyStore,
  onMessage: (msg: Message) => void
): Promise<() => void> {
  const identity = await keys.load();
  if (!identity || !identity.nsec) throw new Error("Cannot decrypt message");

  const nsecDecoded = decode(identity.nsec);
  if (nsecDecoded.type !== "nsec") throw new Error("Cannot decrypt message");
  const sk = nsecDecoded.data;

  return pool.subscribe(
    [{ kinds: [14], "#p": [identity.pubkey] }],
    (event: Event) => {
      try {
        const conversationKey = nip44.v2.utils.getConversationKey(sk, event.pubkey);
        const plaintext = nip44.v2.decrypt(event.content, conversationKey);
        const { body, subject, attachments, conversationId } = parseMessagePayloadAndUnwrap(plaintext, sk, event.pubkey);
        const msg: Message = {
          id: event.id,
          kind: event.kind,
          pubkey: event.pubkey,
          recipientPubkey: identity.pubkey,
          content: body,
          raw: event.content,
          createdAt: event.created_at,
          tags: event.tags,
          subject: subject ?? extractSubject(event),
          preview: extractPreview(body),
          read: false,
          starred: false,
          archived: false,
          snoozedUntil: null,
          spam: false,
          mailbox: "inbox" as const,
          relayUrls: [],
          attachments,
          isEncrypted: true,
          isGiftWrapped: false,
          deliveryStatus: "delivered" as const,
        };
        onMessage(msg);
      } catch {
        // Decryption failed — skip
      }
    }
  );
}
