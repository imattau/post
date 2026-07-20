import { PolyGraph, IndexedDBAdapter, MemoryAdapter } from "@0xx0lostcause0xx0/polypack";

export const EDGE = {
  HAS_LABEL: "HAS_LABEL",
  IN_FOLDER: "IN_FOLDER",
  CHILD_OF: "CHILD_OF",
  BELONGS_TO: "BELONGS_TO",
  REPLIES_TO: "REPLIES_TO",
  PART_OF: "PART_OF",
  SENT_BY: "SENT_BY",
  SENT_TO: "SENT_TO",
  HAS_PARTICIPANT: "HAS_PARTICIPANT",
  HAS_MEMBER: "HAS_MEMBER",
  HAS_GUEST: "HAS_GUEST",
  SHARED_WITH: "SHARED_WITH",
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

export async function ensureWarm() {
  if (!initialized) {
    await graph.warm();
    initialized = true;
  }
}

export async function flushGraph() {
  await graph.flush();
}

export async function deleteDatabase() {
  await graph.dispose();
  initialized = false;
  blobStore.clear();
  fileStore.clear();
}

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

export async function putNode(
  type: string,
  id: string,
  data: Record<string, unknown>,
  searchText?: string,
) {
  stripNonCloneable(data);
  const now = Date.now();
  if (searchText) {
    await graph.addNodeWithEmbedding(
      { id, type, data, insertedAt: now, updatedAt: now },
      searchText,
    );
  } else {
    graph.addNode({ id, type, data, insertedAt: now, updatedAt: now });
  }
  await graph.flush();
}

export async function putNodes(
  items: Array<{ type: string; id: string; data: Record<string, unknown>; searchText?: string }>,
) {
  const now = Date.now();
  for (const item of items) {
    stripNonCloneable(item.data);
    if (item.searchText) {
      await graph.addNodeWithEmbedding(
        { id: item.id, type: item.type, data: item.data, insertedAt: now, updatedAt: now },
        item.searchText,
      );
    } else {
      graph.addNode({ id: item.id, type: item.type, data: item.data, insertedAt: now, updatedAt: now });
    }
  }
  await graph.flush();
}

export async function deleteNode(id: string) {
  await graph.removeNodeSafe(id);
  await graph.flush();
  deleteBlob(id);
  deleteUploadFiles(id);
}

export async function getNode<T>(id: string): Promise<T | undefined> {
  await ensureWarm();
  const node = await graph.getNodeSafe(id);
  if (!node) return undefined;
  return restoreNonCloneable(node.data as T);
}

export async function getNodes<T>(type: string): Promise<T[]> {
  await ensureWarm();
  await graph.flush();
  const nodes = await graph.queryPersisted().whereNodeType(type).toArray();
  return nodes.map((n) => restoreNonCloneable(n.data as T));
}

export async function getNodesOrdered<T>(type: string, field: string, desc = true): Promise<T[]> {
  await ensureWarm();
  await graph.flush();
  const nodes = await graph
    .queryPersisted()
    .whereNodeType(type)
    .orderBy(field, desc ? "desc" : "asc")
    .toArray();
  return nodes.map((n) => restoreNonCloneable(n.data as T));
}

export async function countNodes(type: string): Promise<number> {
  await ensureWarm();
  await graph.flush();
  return graph.queryPersisted().whereNodeType(type).count();
}

export async function clearNodes(type: string) {
  await ensureWarm();
  const ids = await graph.queryPersisted().whereNodeType(type).ids();
  for (const id of ids) {
    await graph.removeNodeSafe(id);
    deleteBlob(id);
    deleteUploadFiles(id);
  }
  await graph.flush();
}

function entityId(item: Record<string, unknown>): string {
  return (item.id ?? item.pubkey ?? item.url) as string;
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

export function messageSearchText(raw: Record<string, unknown>): string {
  const subject = (raw.subject as string) ?? "";
  const content = (raw.content as string) ?? "";
  const preview = (raw.preview as string) ?? "";
  const pubkey = (raw.pubkey as string) ?? "";
  return `${subject} ${subject} ${subject} ${content} ${preview} ${pubkey}`;
}

export function contactSearchText(raw: Record<string, unknown>): string {
  const name = (raw.name as string) ?? "";
  const handle = (raw.handle as string) ?? "";
  const npub = (raw.npub as string) ?? "";
  const pubkey = (raw.pubkey as string) ?? "";
  const bio = (raw.bio as string) ?? "";
  return `${name} ${name} ${name} ${handle} ${handle} ${npub} ${pubkey} ${bio}`;
}

// DEPRECATED: Use graph/helpers directly instead. Kept for migration compat.
export const db = {
  async delete() {
    await deleteDatabase();
  },
};

export { PolyGraph, IndexedDBAdapter, MemoryAdapter };
