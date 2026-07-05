import MiniSearch from "minisearch";
import type { Message, Contact, DriveFile } from "@post/nostr-core";
import type { ContactView } from "@/lib/stores/contacts";
import type { MockMessage } from "@/lib/mock/threads";

export function createMessageSearch() {
  const index = new MiniSearch<Message>({
    fields: ["subject", "content", "preview", "pubkey"],
    storeFields: ["id", "subject", "content", "preview", "pubkey", "mailbox", "createdAt"],
  });

  return {
    search(query: string, messages: Message[]) {
      if (!query.trim()) return messages;
      index.removeAll();
      index.addAll(messages);
      return index.search(query, {
        prefix: true,
        fuzzy: 0.2,
        boost: { subject: 3, content: 1, preview: 1, pubkey: 1 },
      }).map((r) => messages.find((m) => m.id === r.id)).filter(Boolean) as Message[];
    },
  };
}

export function createMockMessageSearch() {
  const index = new MiniSearch<MockMessage>({
    fields: ["subject", "preview", "body"],
    storeFields: ["id", "subject", "preview", "body", "createdAt", "read", "starred"],
  });

  return {
    search(query: string, messages: MockMessage[], searchFields?: (item: MockMessage) => Record<string, string>) {
      if (!query.trim()) return messages;
      const enhanced = searchFields
        ? messages.map((m) => ({ ...m, ...searchFields(m) }))
        : messages;
      index.removeAll();
      index.addAll(enhanced);
      return index.search(query, {
        prefix: true,
        fuzzy: 0.2,
        boost: { subject: 3, preview: 1, body: 1 },
      }).map((r) => messages.find((m) => m.id === r.id)).filter(Boolean) as MockMessage[];
    },
  };
}

export function createContactSearch() {
  const index = new MiniSearch<ContactView>({
    fields: ["name", "handle", "npub", "pubkey", "bio"],
    storeFields: ["id", "name", "handle", "npub", "pubkey", "initials", "color", "bio", "status", "timestamp"],
  });

  return {
    search(query: string, contacts: ContactView[]) {
      if (!query.trim()) return contacts;
      index.removeAll();
      index.addAll(contacts);
      return index.search(query, {
        prefix: true,
        fuzzy: 0.2,
        boost: { name: 3, handle: 2, npub: 1, pubkey: 1, bio: 1 },
      }).map((r) => contacts.find((c) => c.id === r.id)).filter(Boolean) as ContactView[];
    },
  };
}

export function createDriveFileSearch() {
  const index = new MiniSearch<DriveFile>({
    fields: ["name", "preview", "modifiedLabel", "ownerName"],
    storeFields: [
      "id", "name", "preview", "fileKind", "mimeType", "sizeBytes",
      "createdAt", "updatedAt", "ownerName", "ownerInitials",
      "starred", "color", "letter",
    ],
  });

  return {
    search(query: string, files: DriveFile[]) {
      if (!query.trim()) return files;
      index.removeAll();
      index.addAll(files);
      return index.search(query, {
        prefix: true,
        fuzzy: 0.2,
        boost: { name: 3, ownerName: 2, preview: 1, modifiedLabel: 1 },
      }).map((r) => files.find((f) => f.id === r.id)).filter(Boolean) as DriveFile[];
    },
  };
}
