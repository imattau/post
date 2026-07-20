import type { RelayPool } from "@post/nostr-core";
import { parseFileMetadataEvent, parseFolderEvent, decryptContentForOwner, subscribeAccumulate } from "@post/nostr-core";
import type { DriveFile, DriveFolder } from "@/lib/types";
import { graph, putNodes, getNodes, addEdge, EDGE } from "@/lib/db/poly";

function getFolderId(tags: string[][]): string | null {
  return tags.find((t) => t[0] === "folder")?.[1] ?? null;
}

export async function syncDriveFromRelays(
  pool: RelayPool,
  pubkey: string,
  sk?: Uint8Array
): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {

  const [fileEvents, folderEvents] = await Promise.all([
    queryEvents(pool, [{ kinds: [1063], authors: [pubkey], limit: 500 }]),
    queryEvents(pool, [{ kinds: [30063], authors: [pubkey], limit: 100 }]),
  ]);

  const existingFiles = await getNodes<DriveFile>('drive_file');
  const existingFileIds = new Set(existingFiles.map((f) => f.id));
  const newFiles: DriveFile[] = [];
  const fileFolderIds: Record<string, string | null> = {};

  for (const event of fileEvents) {
    const file = parseFileMetadataEvent(event);
    if (event.tags.some((t) => t[0] === "content-encryption") && sk) {
      try {
        file.name = decryptContentForOwner(event.content, sk);
      } catch {
        // Keep placeholder name
      }
    }
    if (!existingFileIds.has(file.id)) {
      newFiles.push(file);
      fileFolderIds[file.id] = getFolderId(event.tags);
    }
  }

  if (newFiles.length > 0) {
    await putNodes(newFiles.map((f: any) => ({ type: 'drive_file', id: f.id, data: f as any })));
    for (const f of newFiles) {
      const folderId = fileFolderIds[f.id];
      if (folderId) await addEdge(f.id, EDGE.IN_FOLDER, folderId);
    }
  }

  const existingFolders = await getNodes<DriveFolder>('drive_folder');
  const existingFolderIds = new Set(existingFolders.map((f) => f.id));
  const newFolders: DriveFolder[] = [];

  for (const event of folderEvents) {
    const folder = parseFolderEvent(event);
    if (event.tags.some((t) => t[0] === "content-encryption") && sk) {
      try {
        folder.name = decryptContentForOwner(event.content, sk);
      } catch {
        // Keep placeholder name
      }
    }
    if (!existingFolderIds.has(folder.id)) {
      newFolders.push(folder);
    }
  }

  if (newFolders.length > 0) {
    await putNodes(newFolders.map((f: any) => ({ type: 'drive_folder', id: f.id, data: f as any })));
  }

  const [allFiles, allFolders] = await Promise.all([
    getNodes<DriveFile>('drive_file'),
    getNodes<DriveFolder>('drive_folder'),
  ]);

  return { files: allFiles, folders: allFolders };
}

function queryEvents(
  pool: RelayPool,
  filters: { kinds: number[]; authors: string[]; limit: number }[]
): Promise<{ id: string; pubkey: string; content: string; tags: string[][]; created_at: number }[]> {
  return subscribeAccumulate(
    pool,
    filters,
    (event, acc) => {
      acc.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        tags: event.tags,
        created_at: event.created_at,
      });
    },
    5000
  );
}
