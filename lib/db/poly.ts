import { PolyGraph, IndexedDBAdapter, MemoryAdapter } from "@0xx0lostcause0xx0/polypack";

export const EDGE = {
  HAS_LABEL: "HAS_LABEL",
  IN_FOLDER: "IN_FOLDER",
  CHILD_OF: "CHILD_OF",
  BELONGS_TO: "BELONGS_TO",
  REPLIES_TO: "REPLIES_TO",
  PART_OF: "PART_OF",
} as const;

const blobStore = new Map<string, Blob>();
const fileStore = new Map<string, File[]>();

export function setBlob(id: string, blob: Blob | null) {
  if (blob) blobStore.set(id, blob);
  else blobStore.delete(id);
}

export function getBlob(id: string): Blob | null {
  return blobStore.get(id) ?? null;
}

export function deleteBlob(id: string) {
  blobStore.delete(id);
}

export function setUploadFiles(id: string, files: File[]) {
  fileStore.set(id, files);
}

export function getUploadFiles(id: string): File[] {
  return fileStore.get(id) ?? [];
}

export function deleteUploadFiles(id: string) {
  fileStore.delete(id);
}

const adapter = typeof indexedDB !== "undefined"
  ? new IndexedDBAdapter({
      name: "PostDB-Poly",
      version: 1,
      nodeIndexes: ["createdAt", "updatedAt"],
    })
  : new MemoryAdapter();

export const graph = new PolyGraph(adapter, 1_000_000);

let initialized = false;

async function ensureWarm() {
  if (!initialized) {
    await graph.warm();
    initialized = true;
  }
}

function stripNonCloneable(item: Record<string, unknown>) {
  const id = item.id as string;
  if ("encryptedBlob" in item) {
    const blob = item.encryptedBlob as Blob | null;
    if (blob) setBlob(id, blob);
    item.encryptedBlob = null;
  }
  if ("attachments" in item && Array.isArray(item.attachments)) {
    const files = item.attachments
      .map((a: Record<string, unknown>) => a.file as File | undefined)
      .filter(Boolean) as File[];
    if (files.length > 0) {
      setUploadFiles(id, files);
      item.attachments = item.attachments.map(
        (a: Record<string, unknown>) => ({ ...a, file: null }),
      );
    }
  }
}

function restoreNonCloneable<T>(item: T): T {
  const data = item as Record<string, unknown>;
  if ("encryptedBlob" in data) {
    data.encryptedBlob = getBlob(data.id as string) ?? null;
  }
  if ("attachments" in data && Array.isArray(data.attachments)) {
    const stored = getUploadFiles(data.id as string);
    if (stored.length > 0) {
      data.attachments = data.attachments.map(
        (a: Record<string, unknown>, i: number) => ({
          ...a,
          file: stored[i] ?? a.file,
        }),
      );
    }
  }
  return item;
}

function entityId(item: Record<string, unknown>): string {
  return (item.id ?? item.pubkey ?? item.url) as string;
}

class PolyTable<T> {
  constructor(private type: string) {}

  async put(item: T) {
    const raw = item as Record<string, unknown>;
    const id = entityId(raw);
    const data = { ...raw };
    stripNonCloneable(data);
    const now = Date.now();
    graph.addNode({
      id,
      type: this.type,
      data,
      insertedAt: now,
      updatedAt: now,
    });
    await graph.flush();
  }

  async bulkPut(items: T[]) {
    const now = Date.now();
    for (const item of items) {
      const raw = item as Record<string, unknown>;
      const id = entityId(raw);
      const data = { ...raw };
      stripNonCloneable(data);
      graph.addNode({
        id,
        type: this.type,
        data,
        insertedAt: now,
        updatedAt: now,
      });
    }
    await graph.flush();
  }

  bulkAdd(items: T[]) {
    return this.bulkPut(items);
  }

  async get(id: string): Promise<T | undefined> {
    await ensureWarm();
    const node = await graph.getNodeSafe(id);
    if (!node) return undefined;
    return restoreNonCloneable(node.data as T);
  }

  async delete(id: string) {
    await graph.removeNodeSafe(id);
    await graph.flush();
    deleteBlob(id);
    deleteUploadFiles(id);
  }

  async toArray(): Promise<T[]> {
    await ensureWarm();
    await graph.flush();
    const nodes = await graph
      .queryPersisted()
      .whereNodeType(this.type)
      .toArray();
    return nodes.map((n) => restoreNonCloneable(n.data as T));
  }

  async count(): Promise<number> {
    await ensureWarm();
    await graph.flush();
    return graph.queryPersisted().whereNodeType(this.type).count();
  }

  async clear() {
    await ensureWarm();
    const ids = await graph
      .queryPersisted()
      .whereNodeType(this.type)
      .ids();
    for (const id of ids) {
      await graph.removeNodeSafe(id);
      deleteBlob(id);
      deleteUploadFiles(id);
    }
    await graph.flush();
  }

  orderBy(field: string) {
    return {
      reverse: () => ({
        toArray: async (): Promise<T[]> => {
          await ensureWarm();
          await graph.flush();
          const nodes = await graph
            .queryPersisted()
            .whereNodeType(this.type)
            .orderBy(field, "desc")
            .toArray();
          return nodes.map((n) => restoreNonCloneable(n.data as T));
        },
      }),
    };
  }
}

export const db = {
  async delete() {
    await graph.dispose();
    initialized = false;
    blobStore.clear();
    fileStore.clear();
    // re-create adapter and graph for fresh start after reload
  },
  messages: new PolyTable<import("@/lib/types").Message>("message"),
  drafts: new PolyTable<import("@/lib/types").Draft>("draft"),
  labels: new PolyTable<import("@/lib/types").Label>("label"),
  contacts: new PolyTable<import("@/lib/types").Contact>("contact"),
  relayConfigs: new PolyTable<import("@/lib/types").RelayConfig>("relay_config"),
  driveFiles: new PolyTable<import("@/lib/types").DriveFile>("drive_file"),
  driveFolders: new PolyTable<import("@/lib/types").DriveFolder>("drive_folder"),
  calendarCalendars: new PolyTable<import("@/lib/types").CalendarCalendar>("calendar"),
  calendarEvents: new PolyTable<import("@/lib/types").CalendarEvent>("calendar_event"),
  groupInboxes: new PolyTable<import("@post/nostr-core").GroupInbox>("group_inbox"),
  conversations: new PolyTable<{ id: string; messageIds: string[] }>("conversation"),
};

export async function addEdge(
  source: string,
  type: string,
  target: string,
) {
  graph.addEdge(source, type, target, undefined, "reference");
  await graph.flush();
}

export async function removeEdges(
  source: string,
  type?: string,
  target?: string,
) {
  graph.removeEdges(source, type, target);
  await graph.flush();
}

export async function ensureConversation(conversationId: string) {
  const existing = await graph.getNodeSafe(conversationId);
  if (!existing) {
    const now = Date.now();
    graph.addNode({
      id: conversationId,
      type: "conversation",
      data: { id: conversationId, messageIds: [] },
      insertedAt: now,
      updatedAt: now,
    });
    await graph.flush();
  }
}
