import { nip44 } from "nostr-tools";
import { getPublicKey } from "nostr-tools/pure";
import { decode } from "nostr-tools/nip19";
import type { Identity, EncryptedBlobMetadata, DriveFile, DriveFolder } from "./types";
import { toBase64, fromBase64, asArrayBuffer } from "./utils/base64";

const DRIVE_INFO = new TextEncoder().encode("post-drive-v1");
const AES_GCM = { name: "AES-GCM", length: 256 } as const;
const HKDF = { name: "HKDF", hash: "SHA-256" } as const;

function requireSecretKey(identity: Identity): Uint8Array {
  if (!identity.nsec) throw new Error("Cannot encrypt drive file");
  const decoded = decode(identity.nsec);
  if (decoded.type !== "nsec") throw new Error("Cannot encrypt drive file");
  return decoded.data;
}

async function deriveMasterKey(secretKey: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", asArrayBuffer(secretKey), HKDF, false, ["deriveKey", "deriveBits"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: DRIVE_INFO } as HkdfParams,
    baseKey,
    AES_GCM,
    false,
    ["encrypt", "decrypt"]
  );
}

async function importAesKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", rawKey, AES_GCM, false, ["encrypt", "decrypt"]);
}

export interface DriveEncryptedPayload {
  ciphertext: Blob;
  metadata: EncryptedBlobMetadata;
}

export async function encryptDriveBlob(blob: Blob, identity: Identity): Promise<DriveEncryptedPayload> {
  const secretKey = requireSecretKey(identity);
  const fileKey = crypto.getRandomValues(new Uint8Array(32));
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const fileIv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const masterKey = await deriveMasterKey(secretKey, salt);
  const fileKeyCrypto = await importAesKey(asArrayBuffer(fileKey));
  const raw = await blob.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: fileIv }, fileKeyCrypto, raw as ArrayBuffer);
  const wrapped = await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, masterKey, asArrayBuffer(fileKey));

  return {
    ciphertext: new Blob([ciphertext], { type: "application/octet-stream" }),
    metadata: {
      version: 1,
      algorithm: "AES-GCM",
      salt: toBase64(salt),
      wrapIv: toBase64(wrapIv),
      fileIv: toBase64(fileIv),
      wrappedKey: toBase64(wrapped),
    },
  };
}

export async function decryptDriveBlob(payload: DriveEncryptedPayload, identity: Identity): Promise<Blob> {
  const secretKey = requireSecretKey(identity);
  const salt = fromBase64(payload.metadata.salt);
  const wrapIv = fromBase64(payload.metadata.wrapIv);
  const fileIv = fromBase64(payload.metadata.fileIv);
  const wrappedKey = fromBase64(payload.metadata.wrappedKey);
  const masterKey = await deriveMasterKey(secretKey, salt);
  const fileKeyBytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(wrapIv) }, masterKey, asArrayBuffer(wrappedKey));
  const fileKey = await importAesKey(fileKeyBytes as ArrayBuffer);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(fileIv) }, fileKey, await payload.ciphertext.arrayBuffer());
  return new Blob([plaintext], { type: payload.ciphertext.type || "application/octet-stream" });
}

export function isDriveEncryptionAvailable(identity: Identity | null): boolean {
  return !!identity?.nsec;
}

export function encryptContentForOwner(content: string, sk: Uint8Array): string {
  const pubkey = getPublicKey(sk);
  const conversationKey = nip44.v2.utils.getConversationKey(sk, pubkey);
  return nip44.v2.encrypt(content, conversationKey);
}

export function decryptContentForOwner(content: string, sk: Uint8Array): string {
  const pubkey = getPublicKey(sk);
  const conversationKey = nip44.v2.utils.getConversationKey(sk, pubkey);
  return nip44.v2.decrypt(content, conversationKey);
}

export function createFileMetadataEvent(file: DriveFile): {
  kind: 1063;
  tags: string[][];
  content: string;
  created_at: number;
} {
  const tags: string[][] = [
    ["url", file.blobUrl ?? ""],
    ["m", file.mimeType],
    ["x", file.sha256 ?? ""],
    ["size", String(file.sizeBytes)],
  ];
  if (file.encrypted) tags.push(["encrypted", "true"]);
  tags.push(["client", "Post"]);

  return {
    kind: 1063,
    tags,
    content: file.name,
    created_at: Math.floor(file.updatedAt / 1000),
  };
}

export function createFolderEvent(folder: DriveFolder): {
  kind: 30063;
  tags: string[][];
  content: string;
  created_at: number;
} {
  return {
    kind: 30063,
    tags: [
      ["d", folder.id],
      ["title", folder.name],
      ["client", "Post"],
    ],
    content: folder.name,
    created_at: Math.floor(folder.updatedAt / 1000),
  };
}

function tagValue(tags: string[][], name: string): string | undefined {
  const tag = tags.find(([key]) => key === name);
  return tag?.[1];
}

export function parseFileMetadataEvent(event: {
  id: string;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
}): DriveFile {
  const url = tagValue(event.tags, "url") ?? "";
  const mime = tagValue(event.tags, "m") ?? "application/octet-stream";
  const sha256 = tagValue(event.tags, "x") ?? null;
  const sizeStr = tagValue(event.tags, "size") ?? "0";
  const encrypted = tagValue(event.tags, "encrypted") === "true";
  const contentEncrypted = tagValue(event.tags, "content-encryption") != null;
  const createdAt = event.created_at * 1000;

  const name = encrypted && contentEncrypted ? "Encrypted file" : (event.content || sha256 || "Untitled");
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  return {
    id: sha256 ?? event.id,
    name,
    fileKind: "other",
    mimeType: mime,
    sizeBytes: parseInt(sizeStr, 10) || 0,
    createdAt,
    updatedAt: createdAt,
    modifiedLabel: new Date(createdAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
    ownerName: event.pubkey.slice(0, 8),
    ownerInitials: event.pubkey.slice(0, 2).toUpperCase(),
    source: "blossom",
    starred: false,
    trashed: false,
    offlineAvailable: false,
    encrypted,
    storedInDrive: true,
    sha256,
    blobUrl: url || null,
    preview: name,
    sharedWith: [],
    tags: encrypted ? ["Encrypted"] : [],
    color: "var(--color-text-secondary)",
    letter: name.slice(0, 1).toUpperCase() || "?",
    encryption: null,
    encryptedBlob: null,
  };
}

export function parseFolderEvent(event: {
  id: string;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
}): DriveFolder {
  const d = tagValue(event.tags, "d") ?? event.id;
  const contentEncrypted = tagValue(event.tags, "content-encryption") != null;
  const title = contentEncrypted ? "Encrypted folder" : (tagValue(event.tags, "title") ?? event.content);

  return {
    id: d,
    name: title,
    fileCount: 0,
    color: "var(--color-brand)",
    updatedAt: event.created_at * 1000,
    starred: false,
    trashed: false,
  };
}
