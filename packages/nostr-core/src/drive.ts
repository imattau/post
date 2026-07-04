import { decode } from "nostr-tools/nip19";
import type { Identity, EncryptedBlobMetadata, DriveFile, DriveFolder } from "./types";

const DRIVE_INFO = new TextEncoder().encode("post-drive-v1");
const AES_GCM = { name: "AES-GCM", length: 256 } as const;
const HKDF = { name: "HKDF", hash: "SHA-256" } as const;

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
    return btoa(binary);
  }
  return Buffer.from(view).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  if (typeof atob !== "function") return new Uint8Array(Buffer.from(value, "base64"));
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function requireSecretKey(identity: Identity): Uint8Array {
  if (!identity.nsec) throw new Error("Drive encryption requires a local private key");
  const decoded = decode(identity.nsec);
  if (decoded.type !== "nsec") throw new Error("Invalid nsec");
  return decoded.data;
}

function asArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
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
  if (file.folderId) tags.push(["folder", file.folderId]);
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
      ...(folder.parentId ? [["parent", folder.parentId]] : []),
      ["client", "Post"],
    ],
    content: folder.name,
    created_at: Math.floor(folder.updatedAt / 1000),
  };
}
