import Dexie, { type EntityTable } from "dexie";
import type {
  Message,
  Draft,
  Label,
  Contact,
  RelayConfig,
  DriveFile,
  DriveFolder,
  CalendarCalendar,
  CalendarEvent,
} from "@/lib/types";
import type { GroupInbox } from "@post/nostr-core";

export class PostDB extends Dexie {
  messages!: EntityTable<Message, "id">;
  drafts!: EntityTable<Draft, "id">;
  labels!: EntityTable<Label, "id">;
  contacts!: EntityTable<Contact, "pubkey">;
  relayConfigs!: EntityTable<RelayConfig, "url">;
  driveFiles!: EntityTable<DriveFile, "id">;
  driveFolders!: EntityTable<DriveFolder, "id">;
  calendarCalendars!: EntityTable<CalendarCalendar, "id">;
  calendarEvents!: EntityTable<CalendarEvent, "id">;
  groupInboxes!: EntityTable<GroupInbox, "id">;

  constructor() {
    super("PostDB");
    this.version(1).stores({
      messages:
        "id, pubkey, recipientPubkey, createdAt, read, starred, archived, spam, mailbox, *labelIds",
      drafts: "id, updatedAt, scheduledFor",
      labels: "id, name",
      contacts: "pubkey, name, lastMessageAt",
      relayConfigs: "url",
    });
    this.version(2).stores({
      messages:
        "id, pubkey, recipientPubkey, createdAt, read, starred, archived, spam, mailbox, *labelIds",
      drafts: "id, updatedAt, scheduledFor",
      labels: "id, name",
      contacts: "pubkey, name, lastMessageAt",
      relayConfigs: "url",
      driveFiles: "id, name, folderId, updatedAt, starred, trashed, source, offlineAvailable, fileKind, *sharedWith",
      driveFolders: "id, name, parentId, updatedAt, trashed",
    });
    this.version(3).stores({
      messages:
        "id, pubkey, recipientPubkey, createdAt, read, starred, archived, spam, mailbox, *labelIds",
      drafts: "id, updatedAt, scheduledFor",
      labels: "id, name",
      contacts: "pubkey, name, lastMessageAt",
      relayConfigs: "url",
      driveFiles: "id, name, folderId, updatedAt, starred, trashed, source, offlineAvailable, fileKind, *sharedWith",
      driveFolders: "id, name, parentId, updatedAt, trashed",
      calendarCalendars: "id, name, enabled, availability",
      calendarEvents: "id, calendarId, startAt, endAt, invitation",
    });
    this.version(4).stores({
      messages:
        "id, conversationId, pubkey, recipientPubkey, createdAt, read, starred, archived, spam, mailbox, *labelIds",
      drafts: "id, updatedAt, scheduledFor",
      labels: "id, name",
      contacts: "pubkey, name, lastMessageAt",
      relayConfigs: "url",
      driveFiles: "id, name, folderId, updatedAt, starred, trashed, source, offlineAvailable, fileKind, *sharedWith",
      driveFolders: "id, name, parentId, updatedAt, trashed",
      calendarCalendars: "id, name, enabled, availability",
      calendarEvents: "id, calendarId, startAt, endAt, invitation",
      groupInboxes: "id, pubkey",
    });
  }
}

export const db = new PostDB();
