import {
  PolyGraph, defineEdges, buildEmbeddingText, BinaryStoreAdapter,
} from "@0xx0lostcause0xx0/polypack";
import type { DataTransform } from "@0xx0lostcause0xx0/polypack";

export const EDGE = defineEdges({
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
});

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

const dataTransform: DataTransform = {
  serialize(data) {
    const copy = { ...data };
    if ("encryptedBlob" in copy) {
      const blob = copy.encryptedBlob as Blob | null;
      if (blob) setBlob(copy.id as string, blob);
      copy.encryptedBlob = null;
    }
    if ("attachments" in copy && Array.isArray(copy.attachments)) {
      const files = copy.attachments
        .map((a: Record<string, unknown>) => a.file as File | undefined)
        .filter(Boolean) as File[];
      if (files.length > 0) {
        setUploadFiles(copy.id as string, files);
        copy.attachments = copy.attachments.map(
          (a: Record<string, unknown>) => ({ ...a, file: null }),
        );
      }
    }
    return { data: copy };
  },
  deserialize(data) {
    const copy = { ...data };
    if ("encryptedBlob" in copy) {
      copy.encryptedBlob = getBlob(copy.id as string) ?? null;
    }
    if ("attachments" in copy && Array.isArray(copy.attachments)) {
      const stored = getUploadFiles(copy.id as string);
      if (stored.length > 0) {
        copy.attachments = copy.attachments.map(
          (a: Record<string, unknown>, i: number) => ({
            ...a,
            file: stored[i] ?? a.file,
          }),
        );
      }
    }
    return copy;
  },
};

const adapter = new BinaryStoreAdapter({ storeDir: "PostDB-Poly" });

export const graph = new PolyGraph(adapter, 1_000_000, undefined, dataTransform);

export async function ensureWarm() {
  await graph.warm();
}

export async function flushGraph() {
  await graph.flush();
}

export async function deleteDatabase() {
  await graph.dispose();
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
  graph.startBatch();
  for (const item of items) {
    if (item.searchText) {
      await graph.addNodeWithEmbedding(
        { id: item.id, type: item.type, data: item.data, insertedAt: now, updatedAt: now },
        item.searchText,
      );
    } else {
      graph.addNode({ id: item.id, type: item.type, data: item.data, insertedAt: now, updatedAt: now });
    }
  }
  graph.endBatch();
  await graph.flush();
}

export async function deleteNode(id: string) {
  await graph.removeNodeSafe(id);
  await graph.flush();
  deleteBlob(id);
  deleteUploadFiles(id);
}

export async function getNode<T>(id: string): Promise<T | undefined> {
  await graph.warm();
  const node = await graph.getNodeSafe(id);
  if (!node) return undefined;
  return node.data as T;
}

export async function getNodes<T>(type: string): Promise<T[]> {
  await graph.warm();
  await graph.flush();
  const nodes = await graph.getNodesByType(type);
  return nodes as T[];
}

export async function getNodesOrdered<T>(type: string, field: string, desc = true): Promise<T[]> {
  await graph.warm();
  await graph.flush();
  return graph.getNodesByTypeOrdered<T>(type, field, desc ? "desc" : "asc");
}

export async function countNodes(type: string): Promise<number> {
  await graph.warm();
  await graph.flush();
  return graph.countNodesByType(type);
}

export async function clearNodes(type: string) {
  await graph.warm();
  const ids = await graph.queryPersisted().whereNodeType(type).ids();
  for (const id of ids) {
    await graph.removeNodeSafe(id);
    deleteBlob(id);
    deleteUploadFiles(id);
  }
  await graph.flush();
}

export function messageSearchText(raw: Record<string, unknown>): string {
  return buildEmbeddingText(
    {
      subject: (raw.subject as string) ?? "",
      content: (raw.content as string) ?? "",
      preview: (raw.preview as string) ?? "",
      pubkey: (raw.pubkey as string) ?? "",
    },
    { subject: 3 },
  );
}

export function contactSearchText(raw: Record<string, unknown>): string {
  return buildEmbeddingText(
    {
      name: (raw.name as string) ?? "",
      handle: (raw.handle as string) ?? "",
      npub: (raw.npub as string) ?? "",
      pubkey: (raw.pubkey as string) ?? "",
      bio: (raw.bio as string) ?? "",
    },
    { name: 3, handle: 2 },
  );
}

export const db = {
  async delete() {
    await deleteDatabase();
  },
};

export { PolyGraph, BinaryStoreAdapter };
