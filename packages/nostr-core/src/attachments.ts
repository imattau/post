import { nip44 } from "nostr-tools";
import { getPublicKey } from "nostr-tools/pure";

const AES_GCM = { name: "AES-GCM", length: 256 } as const;

function toBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  if (typeof atob !== "function") return new Uint8Array(Buffer.from(value, "base64"));
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function asArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

export async function encryptAttachment(
  blob: Blob
): Promise<{ ciphertext: Blob; fileKey: Uint8Array; fileIv: Uint8Array }> {
  const fileKey = new Uint8Array(32);
  const fileIv = new Uint8Array(12);
  crypto.getRandomValues(fileKey);
  crypto.getRandomValues(fileIv);
  const key = await crypto.subtle.importKey("raw", asArrayBuffer(fileKey), AES_GCM, false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: asArrayBuffer(fileIv) }, key, await blob.arrayBuffer());
  return { ciphertext: new Blob([ciphertext], { type: "application/octet-stream" }), fileKey, fileIv };
}

export async function decryptAttachment(
  ciphertext: ArrayBuffer,
  fileKey: Uint8Array,
  fileIv: Uint8Array
): Promise<Blob> {
  const key = await crypto.subtle.importKey("raw", asArrayBuffer(fileKey), AES_GCM, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(fileIv) }, key, ciphertext);
  return new Blob([plaintext]);
}

export function wrapFileKey(
  fileKey: Uint8Array,
  senderSk: Uint8Array,
  recipientPubkey: string
): string {
  const conversationKey = nip44.v2.utils.getConversationKey(senderSk, recipientPubkey);
  return nip44.v2.encrypt(toBase64(fileKey), conversationKey);
}

export function unwrapFileKey(
  wrappedKey: string,
  recipientSk: Uint8Array,
  senderPubkey: string
): Uint8Array {
  const conversationKey = nip44.v2.utils.getConversationKey(recipientSk, senderPubkey);
  const base64Key = nip44.v2.decrypt(wrappedKey, conversationKey);
  return fromBase64(base64Key);
}

export function toBase64Key(bytes: Uint8Array): string {
  return toBase64(bytes);
}

export function fromBase64Key(value: string): Uint8Array {
  return fromBase64(value);
}
