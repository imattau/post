"use client";

import { create } from "zustand";
import { encryptDriveBlob, uploadBlob } from "@post/nostr-core";
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

interface DriveState {
  files: DriveFile[];
  folders: DriveFolder[];
  selectedFileId: string | null;
  query: string;
  filter: DriveFilter;
  sort: DriveSort;
  viewMode: DriveViewMode;
  uploadJobs: DriveUploadJob[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  selectFile: (id: string | null) => void;
  setQuery: (query: string) => void;
  setFilter: (filter: DriveFilter) => void;
  setSort: (sort: DriveSort) => void;
  setViewMode: (viewMode: DriveViewMode) => void;
  toggleStar: (id: string) => Promise<void>;
  toggleTrash: (id: string) => Promise<void>;
  toggleOffline: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<string>;
  enqueueUploads: (files: File[]) => Promise<void>;
  clearUploads: () => void;
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
    case "shared":
      return !file.trashed && file.sharedWith.length >= 3;
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
  query: "",
  filter: "all",
  sort: "recent",
  viewMode: "list",
  uploadJobs: [],
  loading: false,
  error: null,

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
      loading: false,
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

  setQuery(query) {
    set({ query });
  },

  setFilter(filter) {
    set({ filter });
  },

  setSort(sort) {
    set({ sort });
  },

  setViewMode(viewMode) {
    set({ viewMode });
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
    return folder.id;
  },

  async enqueueUploads(files) {
    const identity = useIdentityStore.getState().identity;
    const serverUrl = useBlossomStore.getState().serverUrl;
    const targetFolderId = get().folders[0]?.id ?? null;
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
      set((state) => ({
        uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, status: "uploading" } : job)),
      }));

      try {
        const encrypted = await encryptDriveBlob(file, identity);
        set((state) => ({
          uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, progress: 45 } : job)),
        }));
        const wrappedFile = new File([encrypted.ciphertext], file.name, { type: "application/octet-stream" });
        const ref = await uploadBlob({ url: serverUrl }, wrappedFile, secretKey, (progress) => {
          set((state) => ({
            uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, progress: Math.max(progress, 45) } : job)),
          }));
        });
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
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        set((state) => ({
          uploadJobs: state.uploadJobs.map((job) => (job.id === jobId ? { ...job, status: "failed", error: message } : job)),
          error: message,
        }));
      }
    }
  },

  clearUploads() {
    set({ uploadJobs: [] });
  },
}));

export function getVisibleDriveFiles(state = useDriveStore.getState(), screen: DriveScreen = "my-files"): DriveFile[] {
  const query = state.query.trim().toLowerCase();
  return sortFiles(
    state.files.filter((file) => {
      if (!matchesScreen(file, screen)) return false;
      if (!matchesFilter(file, state.filter)) return false;
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
