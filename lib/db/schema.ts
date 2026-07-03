import Dexie, { type EntityTable } from "dexie";
import type { Message, Draft, Label, Contact, RelayConfig } from "@/lib/types";

export class PostDB extends Dexie {
  messages!: EntityTable<Message, "id">;
  drafts!: EntityTable<Draft, "id">;
  labels!: EntityTable<Label, "id">;
  contacts!: EntityTable<Contact, "pubkey">;
  relayConfigs!: EntityTable<RelayConfig, "url">;

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
  }
}

export const db = new PostDB();
