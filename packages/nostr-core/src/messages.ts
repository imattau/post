import { nip44, nip17, finalizeEvent } from "nostr-tools";
import type { NostrEvent } from "nostr-tools";
import type { RelayPool } from "./relays";
import type { KeyStore } from "./keys";
import type { Message, AttachmentRef } from "./types";

type Event = NostrEvent;

export interface SendOptions {
  to: string;
  content: string;
  subject?: string;
  attachments?: AttachmentRef[];
  replyTo?: string;
  relayOverrides?: string[];
  giftWrap?: boolean;
}

export interface SendResult {
  eventId: string;
  published: Map<string, boolean>;
  delivered: number;
}

export async function sendMessage(
  pool: RelayPool,
  keys: KeyStore,
  opts: SendOptions
): Promise<SendResult> {
  const identity = keys.load();
  if (!identity || !identity.nsec) throw new Error("No private key available");

  const { decode } = await import("nostr-tools/nip19");
  const nsecDecoded = decode(identity.nsec);
  if (nsecDecoded.type !== "nsec") throw new Error("Invalid nsec");
  const sk = nsecDecoded.data;

  let event: NostrEvent;

  if (opts.giftWrap) {
    event = nip17.wrapEvent(
      sk,
      { publicKey: opts.to },
      opts.content,
      opts.subject,
      opts.replyTo ? { eventId: opts.replyTo } : undefined
    );
  } else {
    const conversationKey = nip44.v2.utils.getConversationKey(sk, opts.to);
    const encrypted = nip44.v2.encrypt(opts.content, conversationKey);
    const tags: string[][] = [["p", opts.to]];
    if (opts.subject) tags.push(["subject", opts.subject]);
    if (opts.replyTo) tags.push(["e", opts.replyTo]);

    event = finalizeEvent({
      kind: 14,
      content: encrypted,
      created_at: Math.floor(Date.now() / 1000),
      tags,
    }, sk);
  }

  const published = await pool.publish(event, opts.relayOverrides);
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
  const identity = keys.load();
  if (!identity || !identity.nsec) throw new Error("No private key available");

  const { decode } = await import("nostr-tools/nip19");
  const nsecDecoded = decode(identity.nsec);
  if (nsecDecoded.type !== "nsec") throw new Error("Invalid nsec");
  const sk = nsecDecoded.data;

  const conversationKey = nip44.v2.utils.getConversationKey(sk, event.pubkey);
  return nip44.v2.decrypt(event.content, conversationKey);
}

function extractSubject(event: Event): string {
  const subjectTag = event.tags.find((t) => t[0] === "subject");
  if (subjectTag?.[1]) return subjectTag[1];
  const lines = event.content.split("\n").filter(Boolean);
  return lines[0]?.slice(0, 80) ?? "(no subject)";
}

function extractPreview(content: string): string {
  return content.replace(/\n/g, " ").slice(0, 120);
}

class IncomingStream implements AsyncGenerator<Message> {
  private resolveNext: ((msg: Message) => void) | null = null;
  private queue: Message[] = [];
  private closed = false;
  private unsubscribe: () => void;

  constructor(pool: RelayPool, sk: Uint8Array, pubkey: string) {

    this.unsubscribe = pool.subscribe(
      [{ kinds: [14], "#p": [pubkey] }],
      (event: Event) => {
        try {
          const conversationKey = nip44.v2.utils.getConversationKey(sk, event.pubkey);
          const plaintext = nip44.v2.decrypt(event.content, conversationKey);
          const msg: Message = {
            id: event.id,
            kind: event.kind,
            pubkey: event.pubkey,
            recipientPubkey: pubkey,
            content: plaintext,
            raw: event.content,
            createdAt: event.created_at,
            tags: event.tags,
            subject: extractSubject(event),
            preview: extractPreview(plaintext),
            read: false,
            starred: false,
            archived: false,
            snoozedUntil: null,
            spam: false,
            mailbox: "inbox" as const,
            labelIds: [],
            replyTo: event.tags.find((t) => t[0] === "e")?.[1] ?? null,
            relayUrls: [],
            attachments: [],
            isEncrypted: true,
            isGiftWrapped: false,
            deliveryStatus: "delivered" as const,
          };
          if (this.resolveNext) {
            this.resolveNext(msg);
            this.resolveNext = null;
          } else {
            this.queue.push(msg);
          }
        } catch {
          // Decryption failed — skip
        }
      }
    );
  }

  next(): Promise<IteratorResult<Message>> {
    if (this.closed) return Promise.resolve({ done: true, value: undefined as unknown as Message });
    if (this.queue.length > 0) {
      return Promise.resolve({ done: false, value: this.queue.shift()! });
    }
    return new Promise((resolve) => {
      this.resolveNext = (msg: Message) => resolve({ done: false, value: msg });
    });
  }

  return(): Promise<IteratorResult<Message>> {
    this.closed = true;
    this.unsubscribe();
    return Promise.resolve({ done: true, value: undefined as unknown as Message });
  }

  throw(err: unknown): Promise<IteratorResult<Message>> {
    this.closed = true;
    this.unsubscribe();
    return Promise.reject(err);
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  async [Symbol.asyncDispose]() {
    this.closed = true;
    this.unsubscribe();
  }
}

export async function decryptIncoming(
  pool: RelayPool,
  keys: KeyStore
): Promise<AsyncGenerator<Message>> {
  const identity = keys.load();
  if (!identity || !identity.nsec) throw new Error("No identity or private key");

  const { decode } = await import("nostr-tools/nip19");
  const nsecDecoded = decode(identity.nsec);
  if (nsecDecoded.type !== "nsec") throw new Error("Invalid nsec");
  const sk = nsecDecoded.data;

  return new IncomingStream(pool, sk, identity.pubkey);
}
