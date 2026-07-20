import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"
import { decode, npubEncode } from "nostr-tools/nip19";
import { resolveNip05 } from "@post/nostr-core";
import type { Draft, RecipientEntry } from "./types";
import prettyBytes from "pretty-bytes";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number | undefined | null): string {
  return prettyBytes(Number.isFinite(bytes) ? bytes! : 0);
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "now"
  if (diff < 86_400_000) return formatDistanceToNow(ts, { includeSeconds: false })
  return format(ts, SHORT_DATE)
}

export const SHORT_DATE = "MMM d";
export const SHORT_DATE_TIME = "MMM d, h:mm a";

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(ts: number): string {
  return format(ts, SHORT_DATE_TIME)
}

export function isHexPubkey(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

export function hashInitials(initials: string): number {
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function wrapTextareaSelection(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  body: string,
  fallback = ""
): string {
  const start = textarea.selectionStart ?? body.length
  const end = textarea.selectionEnd ?? body.length
  const selection = body.slice(start, end)
  const content = selection || fallback
  const insertion = `${prefix}${content}${suffix}`
  const next = `${body.slice(0, start)}${insertion}${body.slice(end)}`
  return next
}

export function draftHasContent(draft: Draft): boolean {
  return draft.to.length > 0 || !!draft.subject || !!draft.body
}

export async function parseRecipientEntry(value: string): Promise<RecipientEntry> {
  let pubkey = value;
  let npub = value;

  if (value.startsWith("npub1")) {
    const decoded = decode(value);
    if (decoded.type !== "npub") throw new Error("Expected an npub");
    pubkey = decoded.data;
    npub = value;
  } else if (value.includes("@") && !value.startsWith("npub1")) {
    const result = await resolveNip05(value);
    if (!result) throw new Error("NIP-05 lookup failed for this address");
    pubkey = result.pubkey;
    npub = npubEncode(result.pubkey);
    return {
      pubkey,
      npub,
      name: value,
      avatarUrl: "",
      isGroup: false,
    };
  }

  if (!/^[0-9a-f]{64}$/i.test(pubkey)) {
    throw new Error("Enter a 64-character pubkey, npub, or NIP-05 address");
  }

  return {
    pubkey,
    npub,
    name: value.startsWith("npub1") ? `${value.slice(0, 12)}…` : `${pubkey.slice(0, 8)}…`,
    avatarUrl: "",
    isGroup: false,
  };
}


