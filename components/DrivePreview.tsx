"use client";

import Avatar from "./Avatar";
import FilePreview from "./FilePreview";
import { Button } from "@/components/ui/button";
import { MenuRoot, MenuTrigger, MenuPopup, MenuItem } from "@/components/ui/menu";
import type { DriveFile, DriveScreen } from "@/lib/types";
import type { Identity } from "@post/nostr-core";

function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(bytes >= 10_000 ? 0 : 1)} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes >= 10_000_000 ? 0 : 1)} MB`;
}

function isHexPubkey(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

function displayInitials(value: string): string {
  return isHexPubkey(value) ? value.slice(0, 2).toUpperCase() : value;
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

interface DrivePreviewProps {
  file: DriveFile;
  screen: DriveScreen;
  identity: Identity | null;
  openMenuFileId: string | null;
  onToggleMenu: (fileId: string | null) => void;
  onDownload: (file: DriveFile) => void;
  onShare: (file: DriveFile) => void;
  onStar: (file: DriveFile) => void;
  onTrash: (file: DriveFile) => void;
  onRename: (file: DriveFile) => void;
  onOpenFile: () => void;
  onSetShareFile: (file: DriveFile) => void;
  onToggleOffline: (id: string) => void;
  onDeletePermanently?: (file: DriveFile) => void;
}

export default function DrivePreview({
  file,
  screen,
  identity,
  openMenuFileId,
  onToggleMenu,
  onDownload,
  onShare,
  onStar,
  onTrash,
  onRename,
  onOpenFile,
  onSetShareFile,
  onToggleOffline,
  onDeletePermanently,
}: DrivePreviewProps) {
  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto bg-dock px-6 pt-[22px] pb-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-text-near-white">Preview</h3>
        <div className="relative">
          <MenuRoot open={openMenuFileId === file.id} onOpenChange={(open) => onToggleMenu(open ? file.id : null)}>
            <MenuTrigger className="inline-flex items-center justify-center text-[18px] text-text-secondary outline-none border-none bg-transparent p-0 cursor-pointer"
              render={<span />}
              onClick={(e) => e.stopPropagation()}>
              ⋮
            </MenuTrigger>
            <MenuPopup>
              <MenuItem onClick={() => { onDownload(file); }}>Download</MenuItem>
              <MenuItem onClick={() => { onShare(file); }}>Share</MenuItem>
              <MenuItem onClick={() => { onStar(file); }}>{file.starred ? "Unstar" : "Star"}</MenuItem>
              {onRename && <MenuItem onClick={() => { onRename(file); }}>Rename</MenuItem>}
              <MenuItem onClick={() => { onTrash(file); }}
                className={!file.trashed ? "text-danger" : ""}>
                {file.trashed ? "Restore" : "Trash"}
              </MenuItem>
              {file.trashed && onDeletePermanently && (
                <MenuItem onClick={() => { onDeletePermanently(file); }}
                  className="text-danger">
                  Delete permanently
                </MenuItem>
              )}
            </MenuPopup>
          </MenuRoot>
        </div>
      </div>

      <div className="mt-6">
        <FilePreview file={file} identity={identity} />
      </div>

      <h4 className="mt-6 text-[16px] font-semibold text-text-near-white">{file.name}</h4>
      <p className="mt-2 text-[11px] text-text-secondary">
        {formatSize(file.sizeBytes)} · Updated {file.modifiedLabel.toLowerCase()}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {file.tags.map((tag, index) => (
          <Pill key={`${tag}-${index}`} active={index === 0}>
            {tag}
          </Pill>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-[12px] font-semibold text-text-near-white">Details</p>
        <div className="mt-4 space-y-1">
          <DetailRow label="Owner" value={file.ownerName} />
          <DetailRow
            label="Created"
            value={new Date(file.createdAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <DetailRow label="Storage" value={file.sharedWith.length > 0 ? `${file.sharedWith.length} replicas` : "3 replicas"} />
          <DetailRow label="Access" value={file.trashed ? "In trash" : file.storedInDrive ? "Private" : "Shared"} />
        </div>
      </div>

      {file.sharedWith.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[12px] font-semibold text-text-near-white">Shared with</p>
          <div className="mt-4 flex items-center">
            {file.sharedWith.slice(0, 3).map((entry, index) => (
              <div key={`${file.id}-${entry}-${index}`} className={`relative ${index > 0 ? "-ml-[10px]" : ""}`}>
                <Avatar initials={displayInitials(entry)} size={34} />
              </div>
            ))}
            {file.sharedWith.length > 3 && (
              <div className="-ml-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-pill-subtle text-[10px] font-semibold text-text-secondary">
                +{file.sharedWith.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={onOpenFile}
        className="mt-6 h-[42px] w-full text-[12px] font-semibold"
      >
        {screen === "trash" ? "Restore file" : "Open file"}
      </Button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => onSetShareFile(file)}
        >
          Share
        </Button>
        <Button
          variant="outline"
          onClick={() => onDownload(file)}
        >
          Download
        </Button>
      </div>

      <div className="mt-6 rounded-pill border border-border bg-sidebar p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ok" />
          <p className="text-[11px] font-medium text-text-near-white">
            {file.offlineAvailable ? "Available offline" : "Offline unavailable"}
          </p>
        </div>
        <p className="mt-2 text-[10px] text-text-tertiary">Synced across 3 providers and this device.</p>
        <p className="mt-3 text-[10px] font-medium text-ok">Last verified 18 sec ago</p>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="outline" onClick={() => onTrash(file)}>
          {file.trashed ? "Restore" : "Trash"}
        </Button>
        <Button variant="outline" onClick={() => onStar(file)}>
          {file.starred ? "Unstar" : "Star"}
        </Button>
      </div>
    </aside>
  );
}
