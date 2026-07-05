import MiniSearch from "minisearch";
import type { Message, DriveFile } from "@post/nostr-core";
import type { ContactView } from "@/lib/stores/contacts";
import type { MockMessage } from "@/lib/mock/threads";

function createIndexedSearch<T extends { id: string }>(fields: string[], storeFields: string[], boost: Record<string, number>) {
  let lastItems: T[] | null = null;
  const index = new MiniSearch<T>({ fields, storeFields });

  return {
    search(query: string, items: T[]) {
      if (!query.trim()) return items;

      if (items !== lastItems) {
        index.removeAll();
        index.addAll(items);
        lastItems = items;
      }

      return index.search(query, { prefix: true, fuzzy: 0.2, boost }).map((r) => items.find((item) => item.id === r.id)).filter(Boolean) as T[];
    },
  };
}

export function createMessageSearch() {
  return createIndexedSearch<Message>(
    ["subject", "content", "preview", "pubkey"],
    ["id", "subject", "content", "preview", "pubkey", "mailbox", "createdAt"],
    { subject: 3, content: 1, preview: 1, pubkey: 1 },
  );
}

export function createMockMessageSearch() {
  const base = createIndexedSearch<MockMessage>(
    ["subject", "preview", "body"],
    ["id", "subject", "preview", "body", "createdAt", "read", "starred"],
    { subject: 3, preview: 1, body: 1 },
  );

  return {
    search(query: string, messages: MockMessage[], searchFields?: (item: MockMessage) => Record<string, string>) {
      const enhanced = searchFields ? messages.map((m) => ({ ...m, ...searchFields(m) })) : messages;
      return base.search(query, enhanced);
    },
  };
}

export function createContactSearch() {
  return createIndexedSearch<ContactView>(
    ["name", "handle", "npub", "pubkey", "bio"],
    ["id", "name", "handle", "npub", "pubkey", "initials", "color", "bio", "status", "timestamp"],
    { name: 3, handle: 2, npub: 1, pubkey: 1, bio: 1 },
  );
}

export function createDriveFileSearch() {
  return createIndexedSearch<DriveFile>(
    ["name", "preview", "modifiedLabel", "ownerName"],
    ["id", "name", "preview", "fileKind", "mimeType", "sizeBytes", "createdAt", "updatedAt", "ownerName", "ownerInitials", "starred", "color", "letter"],
    { name: 3, ownerName: 2, preview: 1, modifiedLabel: 1 },
  );
}
