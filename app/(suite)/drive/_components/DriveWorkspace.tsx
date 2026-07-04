"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import UploadProgress from "@/components/UploadProgress";
import { useDriveStore, getVisibleDriveFiles } from "@/lib/stores/drive";
import { decryptDriveBlob } from "@post/nostr-core";
import { useIdentityStore } from "@/lib/stores/identity";
import type { DriveFile, DriveScreen } from "@/lib/types";

const NAV_ITEMS: Array<{ icon: string; label: string; screen?: DriveScreen; href: string }> = [
  { icon: "▣", label: "My files", screen: "my-files", href: "/drive" },
  { icon: "◷", label: "Recent", screen: "recent", href: "/drive/recent" },
  { icon: "☆", label: "Starred", href: "/drive" },
  { icon: "⇄", label: "Shared", screen: "shared", href: "/drive/shared" },
  { icon: "⬇", label: "Offline", screen: "offline", href: "/drive/offline" },
  { icon: "⌁", label: "From Post", screen: "from-post", href: "/drive/from-post" },
  { icon: "⌫", label: "Trash", screen: "trash", href: "/drive/trash" },
];

const FILTERS = [
  { label: "All", value: "all" as const },
  { label: "Documents", value: "documents" as const },
  { label: "Images", value: "images" as const },
  { label: "Media", value: "media" as const },
];

const SCREEN_META: Record<DriveScreen, { title: string; subtitle: string; emptyTitle: string; emptyDescription: string; showFolders: boolean; showUploadDropzone: boolean }> = {
  "my-files": {
    title: "My files",
    subtitle: "Everything attached to your Nostr identity",
    emptyTitle: "No files yet",
    emptyDescription: "Upload or attach a file to start building your Drive.",
    showFolders: true,
    showUploadDropzone: true,
  },
  recent: {
    title: "Recent",
    subtitle: "Files updated in the last 7 days",
    emptyTitle: "No recent files",
    emptyDescription: "Recent uploads and edits will show up here.",
    showFolders: false,
    showUploadDropzone: false,
  },
  shared: {
    title: "Shared",
    subtitle: "Files shared with multiple people",
    emptyTitle: "Nothing shared yet",
    emptyDescription: "Shared files will appear here once you add recipients.",
    showFolders: false,
    showUploadDropzone: false,
  },
  offline: {
    title: "Offline",
    subtitle: "Available on this device",
    emptyTitle: "No offline files",
    emptyDescription: "Mark a file offline to keep it available without a connection.",
    showFolders: false,
    showUploadDropzone: false,
  },
  "from-post": {
    title: "From Post",
    subtitle: "Imported from posts and attachments",
    emptyTitle: "No imported files",
    emptyDescription: "Files attached to posts will appear here.",
    showFolders: false,
    showUploadDropzone: false,
  },
  trash: {
    title: "Trash",
    subtitle: "Deleted files waiting to be restored",
    emptyTitle: "Trash is empty",
    emptyDescription: "Deleted files will stay here until you restore them.",
    showFolders: false,
    showUploadDropzone: false,
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(bytes >= 10_000 ? 0 : 1)} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes >= 10_000_000 ? 0 : 1)} MB`;
}

function labelForKind(kind: DriveFile["fileKind"]): string {
  switch (kind) {
    case "figma":
      return "Figma";
    case "pdf":
      return "PDF";
    case "album":
      return "Album";
    case "spreadsheet":
      return "Spreadsheet";
    case "video":
      return "Video";
    case "markdown":
      return "Markdown";
    case "json":
      return "JSON";
    case "image":
      return "Image";
    default:
      return "File";
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-[11px] text-text-tertiary">{label}</span>
      <span className="text-right text-[11px] font-medium text-text-near-white">{value}</span>
    </div>
  );
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-pill border px-3 text-[12px] font-medium ${
        active ? "border-brand bg-surface-active text-brand-light" : "border-border bg-sidebar text-text-secondary"
      }`}
    >
      {children}
    </span>
  );
}

function FileThumb({ file }: { file: DriveFile }) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-[9px] text-[13px] font-bold text-white"
      style={{ backgroundColor: file.color }}
    >
      {file.letter}
    </div>
  );
}

export default function DriveWorkspace({ screen }: { screen: DriveScreen }) {
  const state = useDriveStore();
  const {
    files,
    folders,
    selectedFileId,
    query,
    filter,
    sort,
    viewMode,
    uploadJobs,
    loading,
    error,
    load,
    selectFile,
    setQuery,
    setFilter,
    setSort,
    setViewMode,
    toggleStar,
    toggleTrash,
    toggleOffline,
    enqueueUploads,
    clearUploads,
  } = state;
  const identity = useIdentityStore((s) => s.identity);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const meta = SCREEN_META[screen];

  useEffect(() => {
    void load();
  }, [load]);

  const visibleFiles = getVisibleDriveFiles(state, screen);
  const selectedFile = visibleFiles.find((file) => file.id === selectedFileId) ?? visibleFiles[0] ?? null;

  useEffect(() => {
    if (visibleFiles.length > 0 && !visibleFiles.some((file) => file.id === selectedFileId)) {
      selectFile(visibleFiles[0].id);
    }
  }, [visibleFiles, selectedFileId, selectFile]);

  const handleChooseFiles = useCallback(() => inputRef.current?.click(), []);

  const handleFiles = useCallback(
    async (picked: File[]) => {
      if (picked.length === 0) return;
      await enqueueUploads(picked);
    },
    [enqueueUploads]
  );

  const onInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(event.target.files ?? []);
      await handleFiles(picked);
      event.target.value = "";
    },
    [handleFiles]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const picked = Array.from(event.dataTransfer.files ?? []);
      await handleFiles(picked);
    },
    [handleFiles]
  );

  const uploadOverlay =
    uploadJobs.length > 0 ? (
      <UploadProgress
        files={uploadJobs.map((job) => ({
          id: job.id,
          name: job.fileName,
          sizeBytes: job.sizeBytes,
          progress: job.progress,
          status:
            job.status === "complete"
              ? "complete"
              : job.status === "failed"
                ? "failed"
                : job.status === "uploading"
                  ? "uploading"
                  : "pending",
          letter: job.fileName.slice(0, 1).toUpperCase() || "?",
          color: "var(--color-brand)",
        }))}
        totalComplete={uploadJobs.filter((job) => job.status === "complete").length}
        totalCount={uploadJobs.length}
        onHide={clearUploads}
      />
    ) : null;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-canvas text-text-primary">
      {uploadOverlay}
      <input ref={inputRef} type="file" multiple className="hidden" onChange={onInputChange} />
      {error && (
        <div className="absolute left-0 right-0 top-0 z-20 flex h-9 items-center justify-center border-b border-danger/30 bg-danger/10 text-[12px] text-danger">
          {error}
        </div>
      )}
      <div className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_352px] divide-x divide-border">
        <aside className="flex min-h-0 flex-col overflow-y-auto bg-sidebar px-6 pt-[25px] pb-4">
          <div>
            <h1 className="text-[22px] font-semibold text-text-near-white">Drive</h1>
            <p className="mt-[5px] text-[11px] text-text-secondary">Files across your Nostr identity</p>
          </div>

          <button
            onClick={handleChooseFiles}
            className="mt-[24px] flex h-12 w-[200px] items-center gap-[15px] rounded-pill bg-brand pl-4 text-left text-white transition-all duration-150 hover:brightness-110"
          >
            <span className="text-[21px] font-medium leading-none">＋</span>
            <span className="text-[14px] font-semibold">New</span>
            <span className="ml-auto pr-4 text-[13px] font-medium">⌄</span>
          </button>

          <nav className="mt-6 flex flex-col gap-[6px]">
            {NAV_ITEMS.map((item) => {
              const isActive = item.screen === screen;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`-ml-2 flex h-[38px] w-[216px] items-center gap-3 rounded-[10px] pl-5 pr-3 text-left transition-all duration-150 ${
                    isActive ? "bg-surface-active text-white" : "text-text-secondary hover:text-text-near-white"
                  }`}
                >
                  <span className={`text-[15px] ${isActive ? "text-brand-light" : ""}`}>{item.icon}</span>
                  <span className="text-[13px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-[30px]">
            <p className="text-[10px] font-semibold tracking-wider text-text-tertiary">STORAGE</p>
            <div className="mt-[14px] flex items-center justify-between">
              <div className="h-[8px] w-[192px] rounded-progress bg-pill-subtle">
                <div className="h-full w-[61%] rounded-progress bg-brand" />
              </div>
              <span className="text-[11px] text-text-tertiary">61%</span>
            </div>
            <div className="mt-[8px] flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">18.4 GB of 30 GB</span>
            </div>
          </div>

          <div className="mt-[44px] rounded-pill border border-border bg-dock p-4">
            <p className="text-[12px] font-semibold text-text-near-white">Storage network</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ok" />
              <span className="text-[11px] text-text-secondary">3 providers healthy</span>
            </div>
            <div className="mt-4 space-y-3 text-[10px]">
              <div className="flex items-center justify-between text-text-tertiary">
                <span>Blossom</span>
                <span className="text-text-near-white">12.2 GB</span>
              </div>
              <div className="flex items-center justify-between text-text-tertiary">
                <span>Local cache</span>
                <span className="text-text-near-white">4.8 GB</span>
              </div>
              <div className="flex items-center justify-between text-text-tertiary">
                <span>Encrypted vault</span>
                <span className="text-text-near-white">1.4 GB</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full">
              <Avatar initials="MT" size={36} />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-[1.5px] border-dock bg-ok" />
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden bg-canvas px-6 pt-[22px] pb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-semibold text-text-near-white">{meta.title}</h2>
              <p className="mt-[6px] text-[11px] text-text-secondary">
                {meta.subtitle}
                {visibleFiles.length > 0 ? ` · ${visibleFiles.length} files` : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-[42px] flex-1 items-center gap-3 rounded-pill border border-border bg-sidebar px-3">
              <span className="text-[15px] text-text-secondary">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files, folders or people"
                className="h-full flex-1 bg-transparent text-[12px] text-text-primary outline-none placeholder:text-text-placeholder"
              />
            </div>
            <button
              onClick={() => setSort(sort === "recent" ? "name" : sort === "name" ? "size" : "recent")}
              className="h-[42px] w-[112px] rounded-pill border border-border bg-sidebar text-[11px] font-medium text-text-secondary"
            >
              Sort: {sort === "recent" ? "Recent" : sort === "name" ? "Name" : "Size"}
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`h-[42px] w-[42px] rounded-pill border text-[15px] font-semibold ${
                viewMode === "grid" ? "border-brand bg-surface-active text-brand-light" : "border-border bg-sidebar text-text-secondary"
              }`}
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-[42px] w-[42px] rounded-pill border text-[15px] font-semibold ${
                viewMode === "list" ? "border-brand bg-surface-active text-brand-light" : "border-border bg-sidebar text-text-secondary"
              }`}
            >
              ☷
            </button>
          </div>

          {meta.showFolders && (
            <>
              <div className="mt-8 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-text-near-white">Folders</h3>
                <button className="text-[11px] font-medium text-brand-light">View all</button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    className="group flex h-[108px] flex-col justify-between rounded-pill border border-border bg-sidebar p-4 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-[32px] w-[42px] items-center justify-center rounded-[9px] text-[14px] font-semibold text-white"
                        style={{ backgroundColor: folder.color }}
                      >
                        ▰
                      </span>
                      <span className="text-[16px] text-text-secondary">⋮</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-text-near-white">{folder.name}</p>
                      <p className="mt-[4px] text-[10px] text-text-tertiary">{folder.fileCount} files</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 flex items-center gap-2">
            <h3 className="mr-2 text-[14px] font-semibold text-text-near-white">Files</h3>
            <div className="flex gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`h-7 rounded-pill border px-3 text-[12px] font-medium ${
                    filter === item.value ? "border-brand bg-surface-active text-brand-light" : "border-border bg-sidebar text-text-secondary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-pill border border-border bg-dock px-4 py-3 text-[11px] text-text-secondary">
            {screen === "trash"
              ? "Trash keeps deleted files available for restore."
              : screen === "shared"
                ? "Shared files are grouped by files shared with multiple people."
                : screen === "offline"
                  ? "Offline files stay available when the device is disconnected."
                  : screen === "from-post"
                    ? "Imported items come from messages and post attachments."
                    : screen === "recent"
                      ? "Recent files are limited to the last 7 days of activity."
                      : "Your main Drive view includes folders, uploads, and recent files."}
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
            {visibleFiles.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-[340px] rounded-pill border border-border bg-sidebar p-6 text-center">
                  <p className="text-[14px] font-semibold text-text-near-white">{meta.emptyTitle}</p>
                  <p className="mt-2 text-[11px] text-text-secondary">{meta.emptyDescription}</p>
                </div>
              </div>
            ) : viewMode === "list" ? (
              <div>
                <div className="grid grid-cols-[1fr_78px_110px] px-[16px] pb-2 text-[10px] font-semibold text-text-tertiary">
                  <span>Name</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Modified</span>
                </div>
                <div className="space-y-0">
                  {visibleFiles.map((file) => {
                    const selected = selectedFile?.id === file.id;
                    return (
                      <button
                        key={file.id}
                        onClick={() => selectFile(file.id)}
                        className={`mb-2 grid w-full grid-cols-[1fr_78px_110px_20px] items-center rounded-[10px] border px-4 py-3 text-left ${
                          selected ? "border-brand bg-surface-active" : "border-border bg-sidebar"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <FileThumb file={file} />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-text-near-white">{file.name}</p>
                            <p className="mt-[4px] text-[10px] text-text-tertiary">{labelForKind(file.fileKind)}</p>
                          </div>
                        </div>
                        <span className="text-right text-[11px] text-text-secondary">{formatSize(file.sizeBytes)}</span>
                        <span className="text-right text-[11px] text-text-secondary">{file.modifiedLabel}</span>
                        <span className="text-right text-[15px] text-text-secondary">⋮</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {visibleFiles.map((file) => {
                  const selected = selectedFile?.id === file.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => selectFile(file.id)}
                      className={`rounded-pill border p-4 text-left ${
                        selected ? "border-brand bg-surface-active" : "border-border bg-sidebar"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <FileThumb file={file} />
                        <span className="text-[16px] text-text-secondary">⋮</span>
                      </div>
                      <p className="mt-4 truncate text-[13px] font-semibold text-text-near-white">{file.name}</p>
                      <p className="mt-1 text-[10px] text-text-tertiary">
                        {labelForKind(file.fileKind)} · {formatSize(file.sizeBytes)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {meta.showUploadDropzone && (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={handleChooseFiles}
              className={`mt-6 flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-pill border ${
                dragActive ? "border-brand bg-surface-active" : "border-border bg-sidebar"
              }`}
            >
              <div className="text-[26px] font-semibold text-brand-light">⇧</div>
              <p className="mt-3 text-[13px] font-semibold text-text-near-white">Drop files here to upload</p>
              <p className="mt-2 text-[10px] text-text-tertiary">Files are encrypted before upload when required</p>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleChooseFiles();
                }}
                className="mt-4 h-7 rounded-pill border border-brand bg-surface-active px-4 text-[12px] font-medium text-brand-light"
              >
                Choose files
              </button>
            </div>
          )}
        </main>

        <aside className="flex min-h-0 flex-col overflow-y-auto bg-dock px-6 pt-[22px] pb-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-text-near-white">Preview</h3>
            <span className="text-[18px] text-text-secondary">⋮</span>
          </div>

          {selectedFile ? (
            <>
              <div className="mt-6 rounded-[16px] border border-border bg-sidebar p-8">
                <div className="flex h-[174px] w-full items-center justify-center rounded-[12px] bg-surface-active/40">
                  <div className="text-center">
                    <div className="text-[52px] font-bold text-brand-light">{selectedFile.letter}</div>
                    <div className="mt-2 text-[11px] font-semibold text-brand-light">
                      {screen === "trash" ? "TRASHED FILE" : "FILE PREVIEW"}
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="mt-6 text-[16px] font-semibold text-text-near-white">{selectedFile.name}</h4>
              <p className="mt-2 text-[11px] text-text-secondary">
                {formatSize(selectedFile.sizeBytes)} · Updated {selectedFile.modifiedLabel.toLowerCase()}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFile.tags.map((tag, index) => (
                  <Pill key={`${tag}-${index}`} active={index === 0}>
                    {tag}
                  </Pill>
                ))}
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <p className="text-[12px] font-semibold text-text-near-white">Details</p>
                <div className="mt-4 space-y-1">
                  <DetailRow label="Owner" value={selectedFile.ownerName} />
                  <DetailRow
                    label="Created"
                    value={new Date(selectedFile.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                  <DetailRow label="Storage" value={selectedFile.sharedWith.length > 0 ? `${selectedFile.sharedWith.length} replicas` : "3 replicas"} />
                  <DetailRow label="Access" value={selectedFile.trashed ? "In trash" : selectedFile.storedInDrive ? "Private" : "Shared"} />
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <p className="text-[12px] font-semibold text-text-near-white">Shared with</p>
                <div className="mt-4 flex items-center">
                  {selectedFile.sharedWith.slice(0, 3).map((initials, index) => (
                    <div key={`${selectedFile.id}-${initials}-${index}`} className={`relative ${index > 0 ? "-ml-[10px]" : ""}`}>
                      <Avatar initials={initials} size={34} />
                    </div>
                  ))}
                  <div className="-ml-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-pill-subtle text-[10px] font-semibold text-text-secondary">
                    +2
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (screen === "trash") {
                    await toggleTrash(selectedFile.id);
                    return;
                  }
                  const blob = selectedFile.encryptedBlob;
                  const metadata = selectedFile.encryption;
                  if (blob && metadata && identity?.nsec) {
                    const plaintext = await decryptDriveBlob({ ciphertext: blob, metadata }, identity);
                    const url = URL.createObjectURL(plaintext);
                    window.open(url, "_blank", "noopener,noreferrer");
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    return;
                  }
                  if (selectedFile.blobUrl) window.open(selectedFile.blobUrl, "_blank", "noopener,noreferrer");
                }}
                className="mt-6 h-[42px] rounded-pill bg-brand text-[12px] font-semibold text-white"
              >
                {screen === "trash" ? "Restore file" : "Open file"}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (selectedFile.blobUrl) window.open(selectedFile.blobUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="h-10 rounded-pill border border-border bg-sidebar text-[12px] font-medium text-text-secondary"
                >
                  Share
                </button>
                <button
                  onClick={async () => {
                    if (!selectedFile.encryptedBlob || !selectedFile.encryption || !identity?.nsec) {
                      void toggleOffline(selectedFile.id);
                      return;
                    }
                    const plaintext = await decryptDriveBlob({ ciphertext: selectedFile.encryptedBlob, metadata: selectedFile.encryption }, identity);
                    const url = URL.createObjectURL(plaintext);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = selectedFile.name;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                  className="h-10 rounded-pill border border-border bg-sidebar text-[12px] font-medium text-text-secondary"
                >
                  Download
                </button>
              </div>

              <div className="mt-6 rounded-pill border border-border bg-sidebar p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ok" />
                  <p className="text-[11px] font-medium text-text-near-white">
                    {selectedFile.offlineAvailable ? "Available offline" : "Offline unavailable"}
                  </p>
                </div>
                <p className="mt-2 text-[10px] text-text-tertiary">Synced across 3 providers and this device.</p>
                <p className="mt-3 text-[10px] font-medium text-ok">Last verified 18 sec ago</p>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => void toggleTrash(selectedFile.id)} className="h-9 rounded-pill border border-border px-4 text-[12px] text-text-secondary">
                  {selectedFile.trashed ? "Restore" : "Trash"}
                </button>
                <button onClick={() => void toggleStar(selectedFile.id)} className="h-9 rounded-pill border border-border px-4 text-[12px] text-text-secondary">
                  {selectedFile.starred ? "Unstar" : "Star"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-pill border border-border bg-sidebar p-6 text-[12px] text-text-secondary">
              No file selected.
            </div>
          )}
        </aside>
      </div>
      {loading && <div className="sr-only">Loading Drive</div>}
    </div>
  );
}
