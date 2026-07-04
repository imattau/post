"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import UploadProgress from "@/components/UploadProgress";
import DriveSidebar from "@/components/DriveSidebar";
import DrivePreview from "@/components/DrivePreview";
import ShareDialog from "@/components/ShareDialog";
import { useDriveStore, getVisibleDriveFiles, getPaginatedFiles } from "@/lib/stores/drive";
import { decryptDriveBlob } from "@post/nostr-core";
import { useIdentityStore } from "@/lib/stores/identity";
import { useBlossomStore } from "@/lib/stores/blossom";
import { Button } from "@/components/ui/button";
import { MenuRoot, MenuTrigger, MenuPopup, MenuItem } from "@/components/ui/menu";
import type { DriveFile, DriveScreen } from "@/lib/types";

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
  starred: {
    title: "Starred",
    subtitle: "Your starred files",
    emptyTitle: "No starred files",
    emptyDescription: "Star a file to easily find it later.",
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
    case "figma": return "Figma";
    case "pdf": return "PDF";
    case "album": return "Album";
    case "spreadsheet": return "Spreadsheet";
    case "video": return "Video";
    case "markdown": return "Markdown";
    case "json": return "JSON";
    case "image": return "Image";
    default: return "File";
  }
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

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-brand/20 text-text-near-white rounded-[2px] px-[1px]">{part}</mark>
      : part
  );
}

export default function DriveWorkspace({ screen }: { screen: DriveScreen }) {
  const state = useDriveStore();
  const {
    files,
    folders,
    selectedFileId,
    selectedFolderId,
    query,
    filter,
    sort,
    viewMode,
    uploadJobs,
    loading,
    error,
    load,
    selectFile,
    selectFolder,
    selectedFileIds,
    toggleFileSelection,
    selectAllFiles,
    clearFileSelection,
    setQuery,
    setFilter,
    setSort,
    setViewMode,
    toggleStar,
    toggleTrash,
    toggleOffline,
    createFolder,
    enqueueUploads,
    clearUploads,
    cancelUpload,
    retryUpload,
    loadMore,
    hasMore,
    updateSharedWith,
  } = state;
  const identity = useIdentityStore((s) => s.identity);
  const blossomUrl = useBlossomStore((s) => s.serverUrl);
  const setBlossomUrl = useBlossomStore((s) => s.setServerUrl);
  const [editingBlossomUrl, setEditingBlossomUrl] = useState(false);
  const [blossomUrlInput, setBlossomUrlInput] = useState(blossomUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [openMenuFileId, setOpenMenuFileId] = useState<string | null>(null);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareFile, setShareFile] = useState<DriveFile | null>(null);
  const [searchInput, setSearchInput] = useState(query);
  const searchParams = useSearchParams();
  const blobParam = searchParams.get("blob");
  const meta = SCREEN_META[screen];

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (screen !== "my-files" && selectedFolderId) selectFolder(null);
    clearFileSelection();
    useDriveStore.getState().resetPage();
  }, [screen, selectedFolderId, selectFolder, clearFileSelection]);

  useEffect(() => {
    if (blobParam && files.length > 0) {
      const match = files.find((f) => f.sha256 === blobParam);
      if (match) selectFile(match.id);
    }
  }, [blobParam, files, selectFile]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput, setQuery]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;
  const paginatedFiles = getPaginatedFiles(state, screen);
  const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
  const totalEncrypted = files.filter((f) => f.encrypted).length;
  const totalOffline = files.filter((f) => f.offlineAvailable).length;
  const storageLimit = 30 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((totalBytes / storageLimit) * 100));
  const visibleFiles = getVisibleDriveFiles(state, screen);
  const selectedFile = visibleFiles.find((file) => file.id === selectedFileId) ?? visibleFiles[0] ?? null;

  useEffect(() => {
    if (visibleFiles.length > 0 && !visibleFiles.some((file) => file.id === selectedFileId)) {
      selectFile(visibleFiles[0].id);
    }
  }, [visibleFiles, selectedFileId, selectFile]);

  const handleChooseFiles = useCallback(() => inputRef.current?.click(), []);
  const handleFiles = useCallback(async (picked: File[]) => {
    if (picked.length === 0) return;
    await enqueueUploads(picked);
  }, [enqueueUploads]);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const id = await createFolder(name);
    selectFolder(id);
    setNewFolderName("");
    setShowNewFolderInput(false);
  }, [newFolderName, createFolder, selectFolder]);

  const handleDownload = useCallback(async (file: DriveFile) => {
    if (!file.encryptedBlob || !file.encryption || !identity?.nsec) {
      void toggleOffline(file.id);
      return;
    }
    const plaintext = await decryptDriveBlob({ ciphertext: file.encryptedBlob, metadata: file.encryption }, identity);
    const url = URL.createObjectURL(plaintext);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [identity, toggleOffline]);

  const handleShare = useCallback((file: DriveFile) => setShareFile(file), []);
  const handleStar = useCallback(async (file: DriveFile) => { await toggleStar(file.id); }, [toggleStar]);
  const handleTrash = useCallback(async (file: DriveFile) => { await toggleTrash(file.id); }, [toggleTrash]);
  const handleRename = useCallback(async (file: DriveFile) => {
    setRenameFileId(file.id);
    setRenameValue(file.name);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameFileId || !renameValue.trim()) return;
    const { db } = await import("@/lib/db/schema");
    const st = useDriveStore.getState();
    const file = st.files.find((f) => f.id === renameFileId);
    if (!file) return;
    const updated = { ...file, name: renameValue.trim(), updatedAt: Date.now() };
    await db.driveFiles.put(updated);
    useDriveStore.setState({ files: st.files.map((f) => (f.id === renameFileId ? updated : f)) });
    setRenameFileId(null);
    setRenameValue("");
  }, [renameFileId, renameValue]);

  const handleBatchTrash = useCallback(async () => {
    for (const id of selectedFileIds) await toggleTrash(id);
    clearFileSelection();
  }, [selectedFileIds, toggleTrash, clearFileSelection]);

  const handleBatchStar = useCallback(async () => {
    for (const id of selectedFileIds) await toggleStar(id);
    clearFileSelection();
  }, [selectedFileIds, toggleStar, clearFileSelection]);

  const handleBatchDownload = useCallback(async () => {
    for (const id of selectedFileIds) {
      const file = files.find((f) => f.id === id);
      if (file) await handleDownload(file);
    }
    clearFileSelection();
  }, [selectedFileIds, files, handleDownload, clearFileSelection]);

  const handleOpenFile = useCallback(async () => {
    if (!selectedFile) return;
    if (screen === "trash") {
      await toggleTrash(selectedFile.id);
      return;
    }
    const blob = selectedFile.encryptedBlob;
    const md = selectedFile.encryption;
    if (blob && md && identity?.nsec) {
      const plaintext = await decryptDriveBlob({ ciphertext: blob, metadata: md }, identity);
      const url = URL.createObjectURL(plaintext);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    if (selectedFile.blobUrl) window.open(selectedFile.blobUrl, "_blank", "noopener,noreferrer");
  }, [selectedFile, screen, identity, toggleTrash]);

  const onInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    await handleFiles(picked);
    event.target.value = "";
  }, [handleFiles]);

  const onDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const picked = Array.from(event.dataTransfer.files ?? []);
    await handleFiles(picked);
  }, [handleFiles]);

  const uploadOverlay = uploadJobs.length > 0 ? (
    <UploadProgress
      files={uploadJobs.map((job) => ({
        id: job.id, name: job.fileName, sizeBytes: job.sizeBytes, progress: job.progress,
        status: job.status === "complete" ? "complete" : job.status === "failed" ? "failed" : job.status === "cancelled" ? "cancelled" : job.status === "uploading" ? "uploading" : "pending",
        letter: job.fileName.slice(0, 1).toUpperCase() || "?",
        color: "var(--color-brand)",
      }))}
      totalComplete={uploadJobs.filter((job) => job.status === "complete").length}
      totalCount={uploadJobs.length}
      onHide={clearUploads}
      onCancel={cancelUpload}
      onRetry={retryUpload}
    />
  ) : null;

  const renderFile = (file: DriveFile, view: "list" | "grid") => {
    const selected = selectedFile?.id === file.id;
    const checked = selectedFileIds.includes(file.id);
    const menuOpen = openMenuFileId === file.id;
    const renaming = renameFileId === file.id;

    const checkbox = (
      <span
        onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}
        className={`flex h-4 w-4 cursor-pointer items-center justify-center rounded-[3px] border text-[9px] font-bold ${
          checked ? "border-brand bg-brand text-white" : "border-border bg-sidebar text-transparent"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
    );

    const renameInput = (
      <div className={`flex items-center gap-2 ${view === "list" ? "rounded-[10px]" : "rounded-pill"} border border-brand bg-surface-active ${view === "list" ? "px-4 py-3" : "p-4"}`}>
        <input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleRenameSubmit();
            if (e.key === "Escape") setRenameFileId(null);
          }}
          autoFocus
          className="h-8 flex-1 rounded-lg border border-border bg-sidebar px-3 text-[12px] text-text-primary outline-none"
        />
        <Button variant="ghost" size="sm" onClick={() => void handleRenameSubmit()}>Save</Button>
        <Button variant="ghost" size="sm" onClick={() => setRenameFileId(null)} className="text-text-secondary">Cancel</Button>
      </div>
    );

    if (view === "list") {
      return (
        <div key={file.id} className="relative mb-2">
          {renaming ? renameInput : (
            <button
              onClick={() => selectFile(file.id)}
              className={`grid w-full grid-cols-[24px_1fr_78px_110px_20px] items-center rounded-[10px] border px-3 py-3 text-left ${
                selected ? "border-brand bg-surface-active" : "border-border bg-sidebar"
              }`}
            >
              {checkbox}
              <div className="flex min-w-0 items-center gap-4">
                <FileThumb file={file} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-text-near-white">{highlightText(file.name, query)}</p>
                  <p className="mt-[4px] text-[10px] text-text-tertiary">{highlightText(labelForKind(file.fileKind), query)}</p>
                </div>
              </div>
              <span className="text-right text-[11px] text-text-secondary">{formatSize(file.sizeBytes)}</span>
              <span className="text-right text-[11px] text-text-secondary">{file.modifiedLabel}</span>
              <div className="relative flex justify-end">
                <MenuRoot open={menuOpen} onOpenChange={(open) => setOpenMenuFileId(open ? file.id : null)}>
                  <MenuTrigger className="inline-flex items-center justify-center text-[15px] text-text-secondary outline-none border-none bg-transparent p-0 cursor-pointer"
                    render={<span />}
                    onClick={(e) => e.stopPropagation()}>
                    ⋮
                  </MenuTrigger>
                  <MenuPopup>
                    <MenuItem onClick={() => { handleDownload(file); }}>Download</MenuItem>
                    <MenuItem onClick={() => { handleShare(file); }}>Share</MenuItem>
                    <MenuItem onClick={() => { handleStar(file); }}>{file.starred ? "Unstar" : "Star"}</MenuItem>
                    <MenuItem onClick={() => { handleRename(file); }}>Rename</MenuItem>
                    <MenuItem onClick={() => { handleTrash(file); }}
                      className={!file.trashed ? "text-danger" : ""}>
                      {file.trashed ? "Restore" : "Trash"}
                    </MenuItem>
                  </MenuPopup>
                </MenuRoot>
              </div>
            </button>
          )}
        </div>
      );
    }

    return (
      <div key={file.id} className="relative">
        {renaming ? renameInput : (
          <button
            onClick={() => selectFile(file.id)}
            className={`w-full rounded-pill border p-4 text-left ${selected ? "border-brand bg-surface-active" : "border-border bg-sidebar"}`}
          >
            <div className="flex items-start justify-between">
              <div className="relative">
                <FileThumb file={file} />
                <div className="absolute -left-1 -top-1">{checkbox}</div>
              </div>
              <div className="relative">
                <MenuRoot open={menuOpen} onOpenChange={(open) => setOpenMenuFileId(open ? file.id : null)}>
                  <MenuTrigger className="inline-flex items-center justify-center text-[16px] text-text-secondary outline-none border-none bg-transparent p-0 cursor-pointer"
                    render={<span />}
                    onClick={(e) => e.stopPropagation()}>
                    ⋮
                  </MenuTrigger>
                  <MenuPopup>
                    <MenuItem onClick={() => { handleDownload(file); }}>Download</MenuItem>
                    <MenuItem onClick={() => { handleShare(file); }}>Share</MenuItem>
                    <MenuItem onClick={() => { handleStar(file); }}>{file.starred ? "Unstar" : "Star"}</MenuItem>
                    <MenuItem onClick={() => { handleRename(file); }}>Rename</MenuItem>
                    <MenuItem onClick={() => { handleTrash(file); }}
                      className={!file.trashed ? "text-danger" : ""}>
                      {file.trashed ? "Restore" : "Trash"}
                    </MenuItem>
                  </MenuPopup>
                </MenuRoot>
              </div>
            </div>
            <p className="mt-4 truncate text-[13px] font-semibold text-text-near-white">{highlightText(file.name, query)}</p>
            <p className="mt-1 text-[10px] text-text-tertiary">
              {highlightText(labelForKind(file.fileKind), query)} · {formatSize(file.sizeBytes)}
            </p>
          </button>
        )}
      </div>
    );
  };

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
        <DriveSidebar
          screen={screen}
          storagePercent={storagePercent}
          totalBytes={totalBytes}
          totalEncrypted={totalEncrypted}
          totalOffline={totalOffline}
          blossomUrl={blossomUrl}
          editingBlossomUrl={editingBlossomUrl}
          blossomUrlInput={blossomUrlInput}
          onBlossomUrlInputChange={setBlossomUrlInput}
          onStartEditBlossom={() => { setBlossomUrlInput(blossomUrl); setEditingBlossomUrl(true); }}
          onSaveBlossom={() => { setBlossomUrl(blossomUrlInput); setEditingBlossomUrl(false); }}
          onCancelEditBlossom={() => { setBlossomUrlInput(blossomUrl); setEditingBlossomUrl(false); }}
          onBlossomKeyDown={(e) => {
            if (e.key === "Enter") { setBlossomUrl(blossomUrlInput); setEditingBlossomUrl(false); }
            if (e.key === "Escape") { setBlossomUrlInput(blossomUrl); setEditingBlossomUrl(false); }
          }}
          onChooseFiles={handleChooseFiles}
        />

        <main className="flex min-h-0 flex-col overflow-hidden bg-canvas px-6 pt-[22px] pb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                {selectedFolder && (
                  <Button variant="outline" size="icon" onClick={() => selectFolder(null)}
                    className="h-8 w-8 rounded-full text-[13px]">
                    ←
                  </Button>
                )}
                <h2 className="text-[24px] font-semibold text-text-near-white">
                  {selectedFolder ? selectedFolder.name : meta.title}
                </h2>
              </div>
              <p className="mt-[6px] text-[11px] text-text-secondary">
                {selectedFolder ? `${selectedFolder.fileCount} files` : meta.subtitle}
                {!selectedFolder && visibleFiles.length > 0 ? ` · ${visibleFiles.length} files` : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3" suppressHydrationWarning>
            <div className="flex h-[42px] flex-1 items-center gap-3 rounded-pill border border-border bg-sidebar px-3">
              <span className="text-[15px] text-text-secondary">⌕</span>
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search files, folders or people"
                className="h-full flex-1 bg-transparent text-[12px] text-text-primary outline-none placeholder:text-text-placeholder" />
            </div>
            <Button variant="outline" onClick={() => setSort(sort === "recent" ? "name" : sort === "name" ? "size" : "recent")}
              className="h-[42px] w-[112px] text-[11px] font-medium">
              Sort: {sort === "recent" ? "Recent" : sort === "name" ? "Name" : "Size"}
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "outline"} size="icon"
              onClick={() => setViewMode("grid")}
              className="h-[42px] w-[42px] rounded-pill text-[15px] font-semibold">
              ▦
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "outline"} size="icon"
              onClick={() => setViewMode("list")}
              className="h-[42px] w-[42px] rounded-pill text-[15px] font-semibold">
              ☷
            </Button>
          </div>

          {meta.showFolders && (
            <>
              <div className="mt-8 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-text-near-white">Folders</h3>
                <Button variant="ghost" onClick={() => setShowNewFolderInput(true)} className="text-brand-light">
                  + New Folder
                </Button>
              </div>
              {showNewFolderInput && (
                <div className="mt-3 flex items-center gap-2">
                  <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleCreateFolder(); if (e.key === "Escape") { setShowNewFolderInput(false); setNewFolderName(""); } }}
                    placeholder="Folder name" autoFocus
                    className="h-9 flex-1 rounded-pill border border-border bg-sidebar px-3 text-[12px] text-text-primary outline-none placeholder:text-text-placeholder" />
                  <Button variant="default" onClick={() => void handleCreateFolder()}>Create</Button>
                  <Button variant="outline" onClick={() => { setShowNewFolderInput(false); setNewFolderName(""); }}>Cancel</Button>
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <button key={folder.id} onClick={() => selectFolder(folder.id)}
                    className="group flex h-[108px] flex-col justify-between rounded-pill border border-border bg-sidebar p-4 text-left hover:border-brand/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <span className="flex h-[32px] w-[42px] items-center justify-center rounded-[9px] text-[14px] font-semibold text-white"
                        style={{ backgroundColor: folder.color }}>▰</span>
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
                <Button key={item.value} variant={filter === item.value ? "secondary" : "outline"} size="sm"
                  onClick={() => setFilter(item.value)}>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-pill border border-border bg-dock px-4 py-3 text-[11px] text-text-secondary">
            {screen === "trash" ? "Trash keeps deleted files available for restore."
              : screen === "shared" ? "Shared files are grouped by files shared with multiple people."
              : screen === "offline" ? "Offline files stay available when the device is disconnected."
              : screen === "from-post" ? "Imported items come from messages and post attachments."
              : screen === "recent" ? "Recent files are limited to the last 7 days of activity."
              : screen === "starred" ? "Starred files let you quickly access your most important files."
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
            ) : (
              <>
                {selectedFileIds.length > 0 && (
                  <div className="mb-3 flex items-center gap-3 rounded-pill border border-brand bg-surface-active px-4 py-2.5">
                    <span className="text-[12px] font-medium text-text-near-white">
                      {selectedFileIds.length} selected
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => void handleBatchTrash()}
                        className="text-danger">
                        {screen === "trash" ? "Delete permanently" : "Trash"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void handleBatchStar()}>
                        Star
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void handleBatchDownload()}>
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearFileSelection}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
                {viewMode === "list" ? (
              <div>
                <div className="grid grid-cols-[24px_1fr_78px_110px] px-[16px] pb-2 text-[10px] font-semibold text-text-tertiary">
                  <span
                    onClick={() => selectAllFiles()}
                    className="cursor-pointer"
                  >
                    {selectedFileIds.length === visibleFiles.length ? "☑" : "☐"}
                  </span>
                  <span>Name</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Modified</span>
                </div>
                <div className="space-y-0">{paginatedFiles.map((file) => renderFile(file, "list"))}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">{paginatedFiles.map((file) => renderFile(file, "grid"))}</div>
            )}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                <span className="text-[11px] text-text-tertiary">Loading more...</span>
              </div>
            )}
            </>
          )}
          </div>

          {meta.showUploadDropzone && (
            <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)} onDrop={onDrop} onClick={handleChooseFiles}
              className={`mt-6 flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-pill border ${dragActive ? "border-brand bg-surface-active" : "border-border bg-sidebar"}`}>
              <div className="text-[26px] font-semibold text-brand-light">⇧</div>
              <p className="mt-3 text-[13px] font-semibold text-text-near-white">Drop files here to upload</p>
              <p className="mt-2 text-[10px] text-text-tertiary">Files are encrypted before upload when required</p>
              <Button variant="secondary" onClick={(e) => { e.stopPropagation(); handleChooseFiles(); }}>
                Choose files
              </Button>
            </div>
          )}
        </main>

        {selectedFile ? (
          <DrivePreview
            file={selectedFile}
            screen={screen}
            identity={identity}
            openMenuFileId={openMenuFileId}
            onToggleMenu={setOpenMenuFileId}
            onDownload={handleDownload}
            onShare={handleShare}
            onStar={handleStar}
            onTrash={handleTrash}
            onRename={handleRename}
            onOpenFile={handleOpenFile}
            onSetShareFile={setShareFile}
            onToggleOffline={toggleOffline}
          />
        ) : (
          <aside className="flex min-h-0 flex-col overflow-y-auto bg-dock px-6 pt-[22px] pb-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-text-near-white">Preview</h3>
            </div>
            <div className="mt-8 rounded-pill border border-border bg-sidebar p-6 text-[12px] text-text-secondary">
              No file selected.
            </div>
          </aside>
        )}
      </div>
      {loading && <div className="sr-only">Loading Drive</div>}
      {shareFile && (
        <ShareDialog file={shareFile} onClose={() => setShareFile(null)}
          onUpdate={(sharedWith) => updateSharedWith(shareFile.id, sharedWith)} />
      )}
    </div>
  );
}
