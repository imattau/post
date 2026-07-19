import type { RelayPool } from "@post/nostr-core";
import { parseFileMetadataEvent, parseFolderEvent, decryptContentForOwner, subscribeAccumulate } from "@post/nostr-core";
import type { DriveFile, DriveFolder } from "@/lib/types";
import { db, addEdge, EDGE } from "@/lib/db/poly";

export async function syncDriveFromRelays(
  pool: RelayPool,
  pubkey: string,
  sk?: Uint8Array
): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {

  const [fileEvents, folderEvents] = await Promise.all([
    queryEvents(pool, [{ kinds: [1063], authors: [pubkey], limit: 500 }]),
    queryEvents(pool, [{ kinds: [30063], authors: [pubkey], limit: 100 }]),
  ]);

  const existingFiles = await db.driveFiles.toArray();
  const existingFileIds = new Set(existingFiles.map((f) => f.id));
  const newFiles: DriveFile[] = [];

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
    }
  }

  if (newFiles.length > 0) {
    await db.driveFiles.bulkPut(newFiles);
    for (const f of newFiles) {
      if (f.folderId) await addEdge(f.id, EDGE.IN_FOLDER, f.folderId);
    }
  }

  const existingFolders = await db.driveFolders.toArray();
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
    await db.driveFolders.bulkPut(newFolders);
  }

  const [allFiles, allFolders] = await Promise.all([
    db.driveFiles.toArray(),
    db.driveFolders.toArray(),
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
