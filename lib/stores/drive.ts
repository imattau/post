"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { encryptDriveBlob, uploadBlob, deleteBlob, createFileMetadataEvent, encryptContentForOwner, createFolderEvent } from "@post/nostr-core";
import type { BlossomServer } from "@post/nostr-core";
import { decode } from "nostr-tools/nip19";
import { finalizeEvent } from "nostr-tools/pure";
import { db } from "@/lib/db/schema";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";
import { useSettingsStore } from "@/lib/stores/settings";
import { useBlossomStore } from "@/lib/stores/blossom";
import { syncDriveFromRelays } from "@/lib/drive-sync";
import { DRIVE_FILES, DRIVE_FOLDERS } from "@/lib/mock/drive";
import { generateId } from "@/lib/utils";
import { cloneFiles, cloneFolders, guessFileKind, guessFileKindFromMime, fileLetter, colorForKind, modifiedLabel, buildFileFromUpload, matchesFilter, sortFiles, matchesScreen } from "@/lib/drive-utils";
import type {
  DriveFile,
  DriveFileKind,
  DriveFilter,
  DriveFolder,
  DriveScreen,
  DriveSort,
  DriveUploadJob,
  DriveViewMode,
} from "@/lib/types";

const uploadAbortControllers = new Map<string, AbortController>();
const uploadOriginalFiles = new Map<string, File>();

interface DriveState {
  files: DriveFile[];
  folders: DriveFolder[];
  selectedFileId: string | null;
  selectedFolderId: string | null;
  selectedFileIds: string[];
  query: string;
  filter: DriveFilter;
  sort: DriveSort;
  viewMode: DriveViewMode;
  uploadJobs: DriveUploadJob[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  selectFile: (id: string | null) => void;
  selectFolder: (id: string | null) => void;
  toggleFileSelection: (id: string) => void;
  selectAllFiles: (screen?: DriveScreen) => void;
  clearFileSelection: () => void;
  setQuery: (query: string) => void;
  setFilter: (filter: DriveFilter) => void;
  setSort: (sort: DriveSort) => void;
  setViewMode: (viewMode: DriveViewMode) => void;
  loadMore: () => void;
  resetPage: () => void;
  toggleStar: (id: string) => Promise<void>;
  toggleTrash: (id: string) => Promise<void>;
  toggleOffline: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<string>;
  renameFolder: (id: string, name: string) => Promise<void>;
  toggleFolderStar: (id: string) => Promise<void>;
  toggleFolderTrash: (id: string) => Promise<void>;
  enqueueUploads: (files: File[]) => Promise<void>;
  clearUploads: () => void;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => Promise<void>;
  updateSharedWith: (id: string, sharedWith: string[]) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  importAttachment: (attachment: { fileName: string; mimeType: string; sizeBytes: number; sha256: string; url: string; encrypted: boolean }, sourceMessageId?: string) => Promise<string>;
}



export const useDriveStore = create<DriveState>()(immer((set, get) => ({
  files: [],
  folders: [],
  selectedFileId: null,
  selectedFolderId: null,
  selectedFileIds: [],
  query: "",
  filter: "all",
  sort: "recent",
  viewMode: "list",
  uploadJobs: [],
  loading: false,
  error: null,
  page: 1,
  pageSize: 50,
  hasMore: true,

  async load() {
    set({ loading: true, error: null });


    const [folderCount, fileCount] = await Promise.all([db.driveFolders.count(), db.driveFiles.count()]);
    if (folderCount === 0) {
      await db.driveFolders.bulkPut(cloneFolders(DRIVE_FOLDERS));
    }
    if (fileCount === 0) {
      await db.driveFiles.bulkPut(cloneFiles(DRIVE_FILES));
    }
    const [folders, files] = await Promise.all([db.driveFolders.toArray(), db.driveFiles.toArray()]);
    const countedFolders = folders.map((folder) => ({
      ...folder,
      fileCount: files.filter((file) => file.folderId === folder.id && !file.trashed).length,
    }));
    const selectedFileId = get().selectedFileId ?? files[0]?.id ?? null;
    set({
      folders: countedFolders,
      files,
      selectedFileId,
      selectedFileIds: [],
      loading: false,
      page: 1,
      hasMore: true,
    });
    void syncFromRelays();
  },

  async refresh() {


    const [folders, files] = await Promise.all([db.driveFolders.toArray(), db.driveFiles.toArray()]);
    const countedFolders = folders.map((folder) => ({
      ...folder,
      fileCount: files.filter((file) => file.folderId === folder.id && !file.trashed).length,
    }));
    set({ folders: countedFolders, files });
  },

  selectFile(id) {
    set({ selectedFileId: id });
  },

  selectFolder(id) {
    set({ selectedFolderId: id, selectedFileId: null, page: 1, hasMore: true });
  },

  toggleFileSelection(id) {
    set((state) => {
      const idx = state.selectedFileIds.indexOf(id);
      if (idx >= 0) state.selectedFileIds.splice(idx, 1);
      else state.selectedFileIds.push(id);
    });
  },

  selectAllFiles(screen: DriveScreen = "my-files") {
    const allIds = getVisibleDriveFiles(get(), screen).map((f) => f.id);
    set((state) => ({
      selectedFileIds: state.selectedFileIds.length === allIds.length ? [] : allIds,
    }));
  },

  clearFileSelection() {
    set({ selectedFileIds: [] });
  },

  setQuery(query) {
    set({ query, page: 1, hasMore: true });
  },

  setFilter(filter) {
    set({ filter, page: 1, hasMore: true });
  },

  setSort(sort) {
    set({ sort, page: 1, hasMore: true });
  },

  setViewMode(viewMode) {
    set({ viewMode });
  },

  loadMore() {
    const { page, pageSize, files, filter, sort, query, selectedFolderId } = get();
    const visible = sortFiles(
      files.filter((file) => {
        if (!matchesScreen(file, "my-files")) return false;
        if (!matchesFilter(file, filter)) return false;
        if (selectedFolderId && file.folderId !== selectedFolderId) return false;
        if (!query) return true;
        const haystack = [file.name, file.preview, file.modifiedLabel, file.ownerName, file.tags.join(" "), file.sharedWith.join(" ")].join(" ").toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      }),
      sort
    );
    const nextPage = page + 1;
    set({
      page: nextPage,
      hasMore: nextPage * pageSize < visible.length,
    });
  },

  resetPage() {
    set({ page: 1, hasMore: true });
  },

  async toggleStar(id) {


    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, starred: !file.starred, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async toggleTrash(id) {


    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, trashed: !file.trashed, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async toggleOffline(id) {


    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, offlineAvailable: !file.offlineAvailable, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async createFolder(name) {
    const folder: DriveFolder = {
      id: generateId(),
      name,
      parentId: null,
      fileCount: 0,
      color: "var(--color-brand)",
      updatedAt: Date.now(),
      starred: false,
      trashed: false,
    };


    await db.driveFolders.put(folder);
    set({ folders: [...get().folders, folder] });
    void publishFolderEvent(folder);
    return folder.id;
  },

  async enqueueUploads(files) {
    const identity = useIdentityStore.getState().identity;
    const serverUrl = useBlossomStore.getState().serverUrl;
    const targetFolderId = get().selectedFolderId ?? get().folders[0]?.id ?? null;
    const jobs = files.map((file) => ({
      id: generateId(),
      fileName: file.name,
      sizeBytes: file.size,
      progress: 0,
      status: "pending" as const,
      error: null,
      fileId: null,
    }));
    set((state) => ({ uploadJobs: [...jobs, ...state.uploadJobs], error: null }));

    if (!identity?.nsec) {
      set((state) => ({
        uploadJobs: state.uploadJobs.map((job) => job.status === "pending" ? { ...job, status: "failed", error: "Drive encryption requires a local private key" } : job),
        error: "Drive encryption requires a local private key",
      }));
      return;
    }
    if (!serverUrl) {
      set((state) => ({
        uploadJobs: state.uploadJobs.map((job) => job.status === "pending" ? { ...job, status: "failed", error: "No Blossom server configured" } : job),
        error: "No Blossom server configured",
      }));
      return;
    }

    const decoded = decode(identity.nsec);
    if (decoded.type !== "nsec") {
      set({ error: "Invalid nsec" });
      return;
    }
    const secretKey = decoded.data;

    for (const [index, file] of files.entries()) {
      const jobId = jobs[index]?.id ?? generateId();
      uploadOriginalFiles.set(jobId, file);

      const controller = new AbortController();
      uploadAbortControllers.set(jobId, controller);

      set((state) => ({
        uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, status: "uploading" } : job)),
      }));

      try {


        const encryptSetting = useSettingsStore.getState().getValue("encrypt-private-uploads", true);
        const encrypted = encryptSetting ? await encryptDriveBlob(file, identity) : null;
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");

        set((state) => ({
          uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, progress: 45 } : job)),
        }));
        const wrappedFile = encrypted
          ? new File([encrypted.ciphertext], file.name, { type: "application/octet-stream" })
          : file;
        const ref = await uploadBlob({ url: serverUrl }, wrappedFile, secretKey, (progress) => {
          set((state) => ({
            uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, progress: Math.max(progress, 45) } : job)),
          }));
        }, controller.signal);
        const blobContent = encrypted ? encrypted.ciphertext : new Blob([]);
        const driveFile = buildFileFromUpload(file, blobContent, ref.url, ref.sha256, targetFolderId);
        const fileRecord = { ...driveFile, encrypted: encryptSetting, encryption: encrypted?.metadata ?? null, encryptedBlob: blobContent };
    

        await db.driveFiles.put(fileRecord);
        set((state) => ({
          files: [driveFile, ...state.files],
          folders: state.folders.map((folder) =>
            folder.id === targetFolderId ? { ...folder, fileCount: folder.fileCount + 1, updatedAt: Date.now() } : folder
          ),
          uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, progress: 100, status: "complete", fileId: driveFile.id } : job)),
          selectedFileId: driveFile.id,
        }));
        void publishFileMetadataEvent(driveFile, secretKey);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          set((state) => ({
            uploadJobs: state.uploadJobs.map((job) =>
              job.id === jobId ? { ...job, status: "cancelled" as const } : job
            ),
          }));
        } else {
          console.error("Upload failed:", err);
          set((state) => ({
            uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, status: "failed", error: "Upload failed" } : job)),
            error: "Upload failed",
          }));
        }
      } finally {
        uploadAbortControllers.delete(jobId);
      }
    }
  },

  clearUploads() {
    set({ uploadJobs: [] });
  },

  cancelUpload(id) {
    const controller = uploadAbortControllers.get(id);
    controller?.abort();
    uploadAbortControllers.delete(id);
    uploadOriginalFiles.delete(id);
    set((state) => ({
      uploadJobs: state.uploadJobs.map((job) =>
        job.id === id ? { ...job, status: "cancelled" as const } : job
      ),
    }));
  },

  async retryUpload(id) {
    const file = uploadOriginalFiles.get(id);
    if (!file) {
      set((state) => ({
        uploadJobs: state.uploadJobs.filter((job) => job.id !== id),
      }));
      return;
    }
    set((state) => ({
      uploadJobs: state.uploadJobs.filter((job) => job.id !== id),
    }));
    uploadOriginalFiles.delete(id);
    uploadAbortControllers.delete(id);
    await get().enqueueUploads([file]);
  },

  async updateSharedWith(id, sharedWith) {


    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, sharedWith, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async deletePermanently(id) {


    const file = get().files.find((item) => item.id === id);
    if (!file) return;

    const identity = useIdentityStore.getState().identity;
    const serverUrl = useBlossomStore.getState().serverUrl;
    if (file.sha256 && serverUrl && identity?.nsec) {
      try {
        const decoded = decode(identity.nsec);
        if (decoded.type === "nsec") {
          const server: BlossomServer = { url: serverUrl };
          await deleteBlob(server, file.sha256, decoded.data);
        }
      } catch {
        // Blossom deletion is best-effort; proceed with local removal
      }
    }

    await db.driveFiles.delete(id);
    const state = get();
    set({
      files: state.files.filter((item) => item.id !== id),
      folders: state.folders.map((folder) =>
        file.folderId && folder.id === file.folderId
          ? { ...folder, fileCount: Math.max(0, folder.fileCount - 1), updatedAt: Date.now() }
          : folder
      ),
      ...(state.selectedFileId === id ? { selectedFileId: state.files.find((f) => f.id !== id)?.id ?? null } : {}),
      selectedFileIds: state.selectedFileIds.filter((fid) => fid !== id),
    });
  },

  async renameFolder(id, name) {


    const folder = get().folders.find((item) => item.id === id);
    if (!folder) return;
    const updated = { ...folder, name, updatedAt: Date.now() };
    await db.driveFolders.put(updated);
    set({ folders: get().folders.map((item) => (item.id === id ? updated : item)) });
  },

  async toggleFolderStar(id) {


    const folder = get().folders.find((item) => item.id === id);
    if (!folder) return;
    const updated = { ...folder, starred: !folder.starred, updatedAt: Date.now() };
    await db.driveFolders.put(updated);
    set({ folders: get().folders.map((item) => (item.id === id ? updated : item)) });
  },

  async toggleFolderTrash(id) {


    const folder = get().folders.find((item) => item.id === id);
    if (!folder) return;
    const updated = { ...folder, trashed: !folder.trashed, updatedAt: Date.now() };
    await db.driveFolders.put(updated);
    set({ folders: get().folders.filter((item) => (item.id === id ? false : true)) });
    if (get().selectedFolderId === id) get().selectFolder(null);
  },

  async importAttachment(attachment, sourceMessageId) {
    const identity = useIdentityStore.getState().identity;
    const now = Date.now();
    const kind = guessFileKindFromMime(attachment.mimeType || "", attachment.fileName);
    const file: DriveFile = {
      id: generateId(),
      name: attachment.fileName,
      folderId: null,
      fileKind: kind,
      mimeType: attachment.mimeType || "application/octet-stream",
      sizeBytes: attachment.sizeBytes,
      createdAt: now,
      updatedAt: now,
      modifiedLabel: modifiedLabel(new Date(now)),
      ownerName: identity?.profile?.displayName ?? identity?.profile?.name ?? "Unknown",
      ownerInitials: (identity?.profile?.displayName ?? identity?.profile?.name ?? "U").slice(0, 2).toUpperCase() || "U",
      source: sourceMessageId ? "post" : "attachment",
      starred: false,
      trashed: false,
      offlineAvailable: false,
      encrypted: attachment.encrypted,
      storedInDrive: true,
      sha256: attachment.sha256,
      blobUrl: attachment.url,
      preview: `Imported from message${sourceMessageId ? ` ${sourceMessageId.slice(0, 8)}` : ""}`,
      sharedWith: [],
      tags: attachment.encrypted ? ["Encrypted", "Blossom"] : ["Blossom"],
      color: colorForKind(kind),
      letter: fileLetter(kind, attachment.fileName),
      encryption: null,
      encryptedBlob: null,
    };


    await db.driveFiles.put(file);
    set((state) => ({ files: [file, ...state.files] }));
    return file.id;
  },
})));

async function publishFileMetadataEvent(file: DriveFile, sk: Uint8Array): Promise<void> {
  try {


    const pool = useRelaysStore.getState().pool;
    if (!pool) return;

    const eventTemplate = createFileMetadataEvent(file);

    if (file.encrypted) {
      eventTemplate.content = encryptContentForOwner(eventTemplate.content, sk);
      eventTemplate.tags.push(["content-encryption", "nip44-v2"]);
    }

    const signedEvent = finalizeEvent(eventTemplate, sk);
    await pool.publish(signedEvent);
  } catch {
    // Publishing file metadata to relays is best-effort
  }
}

async function publishFolderEvent(folder: DriveFolder): Promise<void> {
  try {
    const identity = useIdentityStore.getState().identity;
    const pool = useRelaysStore.getState().pool;
    if (!identity?.nsec || !pool) return;

    const decoded = decode(identity.nsec);
    if (decoded.type !== "nsec") return;
    const sk = decoded.data;

    const eventTemplate = createFolderEvent(folder);

    const encryptedContent = encryptContentForOwner(eventTemplate.content, sk);
    eventTemplate.content = encryptedContent;
    // Replace plaintext title tag with encrypted content
    const titleIdx = eventTemplate.tags.findIndex((t) => t[0] === "title");
    if (titleIdx >= 0) eventTemplate.tags[titleIdx] = ["title", encryptedContent];
    eventTemplate.tags.push(["content-encryption", "nip44-v2"]);

    const signedEvent = finalizeEvent(eventTemplate, sk);
    await pool.publish(signedEvent);
  } catch {
    // Publishing folder event to relays is best-effort
  }
}

async function syncFromRelays(): Promise<void> {
  try {
    const pool = useRelaysStore.getState().pool;
    const identity = useIdentityStore.getState().identity;
    if (!pool || !identity?.pubkey) return;

    let sk: Uint8Array | undefined;
    if (identity?.nsec) {
      const decoded = decode(identity.nsec);
      if (decoded.type === "nsec") sk = decoded.data;
    }

    const { files, folders } = await syncDriveFromRelays(pool, identity.pubkey, sk);
    const countedFolders = folders.map((folder) => ({
      ...folder,
      fileCount: files.filter((file) => file.folderId === folder.id && !file.trashed).length,
    }));
    useDriveStore.setState({ files, folders: countedFolders });
  } catch {
    // Relay sync is best-effort
  }
}

export function getVisibleDriveFiles(state = useDriveStore.getState(), screen: DriveScreen = "my-files"): DriveFile[] {
  const query = state.query.trim().toLowerCase();
  return sortFiles(
    state.files.filter((file) => {
      if (!matchesScreen(file, screen)) return false;
      if (!matchesFilter(file, state.filter)) return false;
      if (state.selectedFolderId && file.folderId !== state.selectedFolderId) return false;
      if (!query) return true;
      const haystack = [
        file.name,
        file.preview,
        file.modifiedLabel,
        file.ownerName,
        file.tags.join(" "),
        file.sharedWith.join(" "),
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    }),
    state.sort
  );
}

export function getPaginatedFiles(state = useDriveStore.getState(), screen: DriveScreen = "my-files"): DriveFile[] {
  const all = getVisibleDriveFiles(state, screen);
  const end = state.page * state.pageSize;
  return all.slice(0, end);
}
