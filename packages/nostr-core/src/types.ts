export interface Profile {
  name: string;
  displayName: string;
  about: string;
  picture: string;
  banner: string;
  website: string;
  nip05: string;
  lud06: string;
  lud16: string;
}

export interface Identity {
  npub: string;
  nsec: string | null;
  pubkey: string;
  nip05: string | null;
  nip05Verified: boolean;
  profile: Profile | null;
}

export interface RelayConfig {
  url: string;
  read: boolean;
  write: boolean;
}

export interface RelayStatus {
  url: string;
  connected: boolean;
  latency: number;
  lastEventAt: number;
  error: string | null;
}

export type MailboxKind = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'archive' | 'spam';

export interface AttachmentRef {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  url: string;
  storedInDrive: boolean;
  encrypted: boolean;
  fileKey?: string;
  fileIv?: string;
}

export type DriveViewMode = "list" | "grid";
export type DriveFilter = "all" | "documents" | "images" | "media";
export type DriveSort = "recent" | "name" | "size";
export type DriveSource = "seed" | "blossom" | "attachment" | "post";
export type DriveFileKind = "figma" | "pdf" | "album" | "spreadsheet" | "video" | "markdown" | "json" | "document" | "image" | "other";

export interface EncryptedBlobMetadata {
  version: 1;
  algorithm: "AES-GCM";
  salt: string;
  wrapIv: string;
  fileIv: string;
  wrappedKey: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
  color: string;
  updatedAt: number;
  starred: boolean;
  trashed: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  folderId: string | null;
  fileKind: DriveFileKind;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
  updatedAt: number;
  modifiedLabel: string;
  ownerName: string;
  ownerInitials: string;
  source: DriveSource;
  starred: boolean;
  trashed: boolean;
  offlineAvailable: boolean;
  encrypted: boolean;
  storedInDrive: boolean;
  sha256: string | null;
  blobUrl: string | null;
  preview: string;
  sharedWith: string[];
  tags: string[];
  color: string;
  letter: string;
  encryption: EncryptedBlobMetadata | null;
  encryptedBlob: Blob | null;
}

export interface DriveUploadJob {
  id: string;
  fileName: string;
  sizeBytes: number;
  progress: number;
  status: "pending" | "uploading" | "complete" | "failed" | "cancelled";
  error: string | null;
  fileId: string | null;
}

export interface AttachmentUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  error: string | null;
  result: AttachmentRef | null;
}

export interface Message {
  id: string;
  kind: number;
  pubkey: string;
  recipientPubkey: string;
  content: string;
  raw: string;
  createdAt: number;
  tags: string[][];
  subject: string;
  preview: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  snoozedUntil: number | null;
  spam: boolean;
  mailbox: MailboxKind;
  labelIds: string[];
  replyTo: string | null;
  relayUrls: string[];
  attachments: AttachmentRef[];
  isEncrypted: boolean;
  isGiftWrapped: boolean;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface Label {
  id: string;
  name: string;
  color: string;
  messageIds: string[];
}

export interface RecipientEntry {
  pubkey: string;
  npub: string;
  name: string;
  avatarUrl: string;
  isGroup: boolean;
}

export interface Draft {
  id: string;
  to: RecipientEntry[];
  cc: RecipientEntry[];
  bcc: RecipientEntry[];
  subject: string;
  body: string;
  attachments: AttachmentUpload[];
  relayOverrides: string[];
  replyTo: string | null;
  createdAt: number;
  updatedAt: number;
  savedAt: number | null;
  scheduledFor: number | null;
}

export interface Contact {
  pubkey: string;
  npub: string;
  name: string;
  about: string;
  picture: string;
  nip05: string;
  nip05Verified: boolean;
  lastMessageAt: number;
  relayRecommended: string;
}
