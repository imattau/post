import { generateId } from "@/lib/utils";
import { format } from "date-fns";
import type { DriveFile, DriveFileKind, DriveFilter, DriveFolder, DriveScreen, DriveSort } from "@/lib/types";

export const FILE_KIND_CONFIG: Record<DriveFileKind, { letter: string; color: string; mimePatterns: ((name: string, mime: string) => boolean)[] }> = {
  figma:      { letter: "F", color: "var(--color-brand)",          mimePatterns: [(n) => n.endsWith(".fig")] },
  pdf:        { letter: "P", color: "var(--color-danger)",         mimePatterns: [(n, m) => m.includes("pdf") || n.endsWith(".pdf")] },
  image:      { letter: "I", color: "var(--color-info)",           mimePatterns: [(_, m) => m.startsWith("image/")] },
  video:      { letter: "V", color: "var(--color-warn)",           mimePatterns: [(_, m) => m.startsWith("video/")] },
  spreadsheet:{ letter: "S", color: "var(--color-ok)",             mimePatterns: [(n) => n.endsWith(".csv")] },
  markdown:   { letter: "M", color: "var(--color-teal)",           mimePatterns: [(n) => n.endsWith(".md")] },
  json:       { letter: "J", color: "var(--color-pill-subtle)",    mimePatterns: [(n) => n.endsWith(".json")] },
  album:      { letter: "A", color: "var(--color-info)",           mimePatterns: [(_, m) => m.includes("album")] },
  document:   { letter: "D", color: "var(--color-ok)",             mimePatterns: [(_, m) => m.includes("text/")] },
  other:      { letter: "",  color: "var(--color-text-secondary)",  mimePatterns: [] },
};

export function cloneFiles(files: DriveFile[]): DriveFile[] {
  return structuredClone(files);
}

export function cloneFolders(folders: DriveFolder[]): DriveFolder[] {
  return structuredClone(folders);
}

export function guessFileKind(file: File): DriveFileKind {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return guessFileKindFromMime(mime, name);
}

export function guessFileKindFromMime(mimeType: string, fileName: string): DriveFileKind {
  const name = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  for (const [kind, config] of Object.entries(FILE_KIND_CONFIG)) {
    if (config.mimePatterns.some((pattern) => pattern(name, mime))) return kind as DriveFileKind;
  }
  return "other";
}

export function fileLetter(kind: DriveFileKind, name: string): string {
  return FILE_KIND_CONFIG[kind].letter || name.slice(0, 1).toUpperCase() || "?";
}

export function colorForKind(kind: DriveFileKind): string {
  return FILE_KIND_CONFIG[kind].color;
}

export function modifiedLabel(date = new Date()): string {
  return format(date, "cccc, MMM d");
}

export function buildFileFromUpload(file: File, encryptedBlob: Blob, blobUrl: string, sha256: string, folderId: string | null): DriveFile {
  const kind = guessFileKind(file);
  const now = Date.now();
  return {
    id: generateId(),
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

export function matchesFilter(file: DriveFile, filter: DriveFilter): boolean {
  if (filter === "all") return true;
  if (filter === "documents") return ["pdf", "markdown", "json", "spreadsheet", "document", "figma"].includes(file.fileKind);
  if (filter === "images") return file.fileKind === "image" || file.fileKind === "album" || file.mimeType.startsWith("image/");
  if (filter === "media") return file.fileKind === "video";
  return true;
}

export function sortFiles(files: DriveFile[], sort: DriveSort): DriveFile[] {
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

export function matchesScreen(file: DriveFile, screen: DriveScreen): boolean {
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
