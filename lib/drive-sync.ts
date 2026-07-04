import type { RelayPool } from "@post/nostr-core";
import type { DriveFile, DriveFolder } from "@/lib/types";

export async function syncDriveFromRelays(
  pool: RelayPool,
  pubkey: string
): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {
  const { parseFileMetadataEvent, parseFolderEvent } = await import("@post/nostr-core");
  const { db } = await import("@/lib/db/schema");

  const [fileEvents, folderEvents] = await Promise.all([
    queryEvents(pool, [{ kinds: [1063], authors: [pubkey], limit: 500 }]),
    queryEvents(pool, [{ kinds: [30063], authors: [pubkey], limit: 100 }]),
  ]);

  const existingFiles = await db.driveFiles.toArray();
  const existingFileIds = new Set(existingFiles.map((f) => f.id));
  const newFiles: DriveFile[] = [];

  for (const event of fileEvents) {
    const file = parseFileMetadataEvent(event);
    if (!existingFileIds.has(file.id)) {
      newFiles.push(file);
    }
  }

  if (newFiles.length > 0) {
    await db.driveFiles.bulkPut(newFiles);
  }

  const existingFolders = await db.driveFolders.toArray();
  const existingFolderIds = new Set(existingFolders.map((f) => f.id));
  const newFolders: DriveFolder[] = [];

  for (const event of folderEvents) {
    const folder = parseFolderEvent(event);
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
  return new Promise((resolve) => {
    const results: { id: string; pubkey: string; content: string; tags: string[][]; created_at: number }[] = [];
    const unsub = pool.subscribe(filters, (event) => {
      results.push({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        tags: event.tags,
        created_at: event.created_at,
      });
    });
    setTimeout(() => {
      resolve(results);
      unsub();
    }, 5000);
  });
}
