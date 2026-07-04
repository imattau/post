"use client";

import { create } from "zustand";
import { encryptDriveBlob, uploadBlob, deleteBlob } from "@post/nostr-core";
import type { BlossomServer } from "@post/nostr-core";
import { decode } from "nostr-tools/nip19";
import { useIdentityStore } from "@/lib/stores/identity";
import { useBlossomStore } from "@/lib/stores/blossom";
import { DRIVE_FILES, DRIVE_FOLDERS } from "@/lib/mock/drive";
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
  selectAllFiles: () => void;
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
  enqueueUploads: (files: File[]) => Promise<void>;
  clearUploads: () => void;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => Promise<void>;
  updateSharedWith: (id: string, sharedWith: string[]) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  importAttachment: (attachment: { fileName: string; mimeType: string; sizeBytes: number; sha256: string; url: string; encrypted: boolean }, sourceMessageId?: string) => Promise<string>;
}

function cloneFiles(files: DriveFile[]): DriveFile[] {
  return files.map((file) => ({ ...file, sharedWith: [...file.sharedWith], tags: [...file.tags] }));
}

function cloneFolders(folders: DriveFolder[]): DriveFolder[] {
  return folders.map((folder) => ({ ...folder }));
}

function guessFileKind(file: File): DriveFileKind {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return guessFileKindFromMime(mime, name);
}

function guessFileKindFromMime(mimeType: string, fileName: string): DriveFileKind {
  const name = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  if (name.endsWith(".fig")) return "figma";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (name.endsWith(".csv")) return "spreadsheet";
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".json")) return "json";
  if (mime.includes("album")) return "album";
  if (mime.includes("text/")) return "document";
  return "other";
}

function fileLetter(kind: DriveFileKind, name: string): string {
  if (kind === "figma") return "F";
  if (kind === "pdf") return "P";
  if (kind === "album") return "A";
  if (kind === "spreadsheet") return "S";
  if (kind === "video") return "V";
  if (kind === "markdown") return "M";
  if (kind === "json") return "J";
  if (kind === "image") return "I";
  return name.slice(0, 1).toUpperCase() || "?";
}

function colorForKind(kind: DriveFileKind): string {
  switch (kind) {
    case "figma":
      return "var(--color-brand)";
    case "pdf":
      return "var(--color-danger)";
    case "album":
      return "var(--color-info)";
    case "spreadsheet":
      return "var(--color-ok)";
    case "video":
      return "var(--color-warn)";
    case "markdown":
      return "var(--color-teal)";
    case "json":
      return "var(--color-pill-subtle)";
    case "image":
      return "var(--color-info)";
    default:
      return "var(--color-text-secondary)";
  }
}

function modifiedLabel(date = new Date()): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function buildFileFromUpload(file: File, encryptedBlob: Blob, blobUrl: string, sha256: string, folderId: string | null): DriveFile {
  const kind = guessFileKind(file);
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: file.name,
    folderId,
    fileKind: kind,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    createdAt: now,
    updatedAt: now,
    modifiedLabel: modifiedLabel(new Date(now)),
    ownerName: "Matt Thomson",
    ownerInitials: "MT",
    source: "blossom",
    starred: false,
    trashed: false,
    offlineAvailable: true,
    encrypted: true,
    storedInDrive: true,
    sha256,
    blobUrl,
    preview: `${file.name} uploaded to Drive`,
    sharedWith: [],
    tags: ["Encrypted", "Blossom", "Offline"],
    color: colorForKind(kind),
    letter: fileLetter(kind, file.name),
    encryption: null,
    encryptedBlob,
  };
}

function matchesFilter(file: DriveFile, filter: DriveFilter): boolean {
  if (filter === "all") return true;
  if (filter === "documents") return ["pdf", "markdown", "json", "spreadsheet", "document", "figma"].includes(file.fileKind);
  if (filter === "images") return file.fileKind === "image" || file.fileKind === "album" || file.mimeType.startsWith("image/");
  if (filter === "media") return file.fileKind === "video";
  return true;
}

function sortFiles(files: DriveFile[], sort: DriveSort): DriveFile[] {
  const cloned = [...files];
  switch (sort) {
    case "name":
      return cloned.sort((a, b) => a.name.localeCompare(b.name));
    case "size":
      return cloned.sort((a, b) => b.sizeBytes - a.sizeBytes);
    default:
      return cloned.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

function matchesScreen(file: DriveFile, screen: DriveScreen): boolean {
  switch (screen) {
    case "my-files":
      return !file.trashed;
    case "recent":
      return !file.trashed && file.updatedAt >= Date.now() - 1000 * 60 * 60 * 24 * 7;
    case "starred":
      return !file.trashed && file.starred;
    case "shared":
      return !file.trashed && file.sharedWith.length > 0;
    case "offline":
      return !file.trashed && file.offlineAvailable;
    case "from-post":
      return !file.trashed && (file.source === "post" || file.source === "attachment");
    case "trash":
      return file.trashed;
  }
}

export const useDriveStore = create<DriveState>((set, get) => ({
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
    const { db } = await import("@/lib/db/schema");
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
  },

  async refresh() {
    const { db } = await import("@/lib/db/schema");
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
    set((state) => ({
      selectedFileIds: state.selectedFileIds.includes(id)
        ? state.selectedFileIds.filter((fid) => fid !== id)
        : [...state.selectedFileIds, id],
    }));
  },

  selectAllFiles() {
    const screen = "my-files";
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
    const { db } = await import("@/lib/db/schema");
    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, starred: !file.starred, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async toggleTrash(id) {
    const { db } = await import("@/lib/db/schema");
    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, trashed: !file.trashed, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async toggleOffline(id) {
    const { db } = await import("@/lib/db/schema");
    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, offlineAvailable: !file.offlineAvailable, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async createFolder(name) {
    const folder: DriveFolder = {
      id: crypto.randomUUID(),
      name,
      parentId: null,
      fileCount: 0,
      color: "var(--color-brand)",
      updatedAt: Date.now(),
      starred: false,
      trashed: false,
    };
    const { db } = await import("@/lib/db/schema");
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
      id: crypto.randomUUID(),
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
      const jobId = jobs[index]?.id ?? crypto.randomUUID();
      uploadOriginalFiles.set(jobId, file);

      const controller = new AbortController();
      uploadAbortControllers.set(jobId, controller);

      set((state) => ({
        uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, status: "uploading" } : job)),
      }));

      try {
        const encrypted = await encryptDriveBlob(file, identity);
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");

        set((state) => ({
          uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, progress: 45 } : job)),
        }));
        const wrappedFile = new File([encrypted.ciphertext], file.name, { type: "application/octet-stream" });
        const ref = await uploadBlob({ url: serverUrl }, wrappedFile, secretKey, (progress) => {
          set((state) => ({
            uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, progress: Math.max(progress, 45) } : job)),
          }));
        }, controller.signal);
        const driveFile = buildFileFromUpload(file, encrypted.ciphertext, ref.url, ref.sha256, targetFolderId);
        const { db } = await import("@/lib/db/schema");
        await db.driveFiles.put({ ...driveFile, encryption: encrypted.metadata, blobUrl: ref.url, sha256: ref.sha256, encryptedBlob: encrypted.ciphertext });
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
          const message = err instanceof Error ? err.message : "Upload failed";
          set((state) => ({
            uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, status: "failed", error: message } : job)),
            error: message,
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
        uploadJobs: state.uploadJobs.map((job) =>
          job.id === id ? { ...job, status: "failed" as const, error: "Original file not available for retry" } : job
        ),
      }));
      return;
    }
    await get().enqueueUploads([file]);
  },

  async updateSharedWith(id, sharedWith) {
    const { db } = await import("@/lib/db/schema");
    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = { ...file, sharedWith, updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    set({ files: get().files.map((item) => (item.id === id ? updated : item)) });
  },

  async deletePermanently(id) {
    const { db } = await import("@/lib/db/schema");
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

  async importAttachment(attachment, sourceMessageId) {
    const identity = useIdentityStore.getState().identity;
    const now = Date.now();
    const kind = guessFileKindFromMime(attachment.mimeType || "", attachment.fileName);
    const file: DriveFile = {
      id: crypto.randomUUID(),
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
    const { db } = await import("@/lib/db/schema");
    await db.driveFiles.put(file);
    set((state) => ({ files: [file, ...state.files] }));
    return file.id;
  },
}));

async function publishFileMetadataEvent(file: DriveFile, sk: Uint8Array): Promise<void> {
  try {
    const { createFileMetadataEvent } = await import("@post/nostr-core");
    const { finalizeEvent } = await import("nostr-tools/pure");
    const { useRelaysStore } = await import("@/lib/stores/relays");

    const pool = useRelaysStore.getState().pool;
    if (!pool) return;

    const eventTemplate = createFileMetadataEvent(file);
    const signedEvent = finalizeEvent(eventTemplate, sk);
    await pool.publish(signedEvent);
  } catch {
    // Publishing file metadata to relays is best-effort
  }
}

async function publishFolderEvent(folder: DriveFolder): Promise<void> {
  try {
    const { createFolderEvent } = await import("@post/nostr-core");
    const { finalizeEvent } = await import("nostr-tools/pure");
    const { useIdentityStore } = await import("@/lib/stores/identity");
    const { useRelaysStore } = await import("@/lib/stores/relays");

    const identity = useIdentityStore.getState().identity;
    const pool = useRelaysStore.getState().pool;
    if (!identity?.nsec || !pool) return;

    const { decode } = await import("nostr-tools/nip19");
    const decoded = decode(identity.nsec);
    if (decoded.type !== "nsec") return;
    const sk = decoded.data;

    const eventTemplate = createFolderEvent(folder);
    const signedEvent = finalizeEvent(eventTemplate, sk);
    await pool.publish(signedEvent);
  } catch {
    // Publishing folder event to relays is best-effort
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

export function getDriveSelection(state = useDriveStore.getState()): DriveFile | null {
  return state.files.find((file) => file.id === state.selectedFileId) ?? state.files[0] ?? null;
}

export function getPaginatedFiles(state = useDriveStore.getState(), screen: DriveScreen = "my-files"): DriveFile[] {
  const all = getVisibleDriveFiles(state, screen);
  const end = state.page * state.pageSize;
  return all.slice(0, end);
}
