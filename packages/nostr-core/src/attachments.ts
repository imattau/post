import { nip44 } from "nostr-tools";
import { getPublicKey } from "nostr-tools/pure";
import { toBase64, fromBase64, asArrayBuffer } from "./utils/base64";

const AES_GCM = { name: "AES-GCM", length: 256 } as const;

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

export { toBase64 as toBase64Key, fromBase64 as fromBase64Key } from "./utils/base64";
