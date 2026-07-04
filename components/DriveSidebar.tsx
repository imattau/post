"use client";

import Link from "next/link";
import Avatar from "./Avatar";
import type { DriveScreen } from "@/lib/types";

interface DriveSidebarProps {
  screen: DriveScreen;
  storagePercent: number;
  totalBytes: number;
  totalEncrypted: number;
  totalOffline: number;
  blossomUrl: string;
  editingBlossomUrl: boolean;
  blossomUrlInput: string;
  onBlossomUrlInputChange: (val: string) => void;
  onStartEditBlossom: () => void;
  onSaveBlossom: () => void;
  onCancelEditBlossom: () => void;
  onBlossomKeyDown: (e: React.KeyboardEvent) => void;
  onChooseFiles: () => void;
}

const NAV_ITEMS: Array<{ icon: string; label: string; screen?: DriveScreen; href: string }> = [
  { icon: "▣", label: "My files", screen: "my-files", href: "/drive" },
  { icon: "◷", label: "Recent", screen: "recent", href: "/drive/recent" },
  { icon: "☆", label: "Starred", screen: "starred", href: "/drive/starred" },
  { icon: "⇄", label: "Shared", screen: "shared", href: "/drive/shared" },
  { icon: "⬇", label: "Offline", screen: "offline", href: "/drive/offline" },
  { icon: "⌁", label: "From Post", screen: "from-post", href: "/drive/from-post" },
  { icon: "⌫", label: "Trash", screen: "trash", href: "/drive/trash" },
];

function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(bytes >= 10_000 ? 0 : 1)} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes >= 10_000_000 ? 0 : 1)} MB`;
}

const storageLimit = 30 * 1024 * 1024 * 1024;

export default function DriveSidebar({
  screen,
  storagePercent,
  totalBytes,
  totalEncrypted,
  totalOffline,
  blossomUrl,
  editingBlossomUrl,
  blossomUrlInput,
  onBlossomUrlInputChange,
  onStartEditBlossom,
  onSaveBlossom,
  onCancelEditBlossom,
  onBlossomKeyDown,
  onChooseFiles,
}: DriveSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto bg-sidebar px-6 pt-[25px] pb-4">
      <div>
        <h1 className="text-[22px] font-semibold text-text-near-white">Drive</h1>
        <p className="mt-[5px] text-[11px] text-text-secondary">Files across your Nostr identity</p>
      </div>

      <button
        onClick={onChooseFiles}
        className="mt-[24px] flex h-12 w-[200px] items-center gap-[15px] rounded-pill bg-brand pl-4 text-left text-white transition-all duration-150 hover:brightness-110"
      >
        <span className="text-[21px] font-medium leading-none">+</span>
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
            <div className="h-full rounded-progress bg-brand" style={{ width: `${storagePercent}%` }} />
          </div>
          <span className="text-[11px] text-text-tertiary">{storagePercent}%</span>
        </div>
        <div className="mt-[8px] flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">{formatSize(totalBytes || 0)} of {formatSize(storageLimit)}</span>
        </div>
      </div>

      <div className="mt-[44px] rounded-pill border border-border bg-dock p-4">
        <p className="text-[12px] font-semibold text-text-near-white">Storage network</p>
        <div className="mt-3 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${blossomUrl ? "bg-ok" : "bg-danger"}`} />
          <span className="text-[11px] text-text-secondary">
            {blossomUrl ? "Blossom connected" : "No Blossom server"}
          </span>
        </div>
        <div className="mt-3">
          {editingBlossomUrl ? (
            <div className="flex items-center gap-2">
              <input
                value={blossomUrlInput}
                onChange={(e) => onBlossomUrlInputChange(e.target.value)}
                onKeyDown={onBlossomKeyDown}
                placeholder="https://blossom.example.com"
                autoFocus
                className="h-7 flex-1 rounded-pill border border-border bg-sidebar px-3 text-[10px] text-text-primary outline-none placeholder:text-text-placeholder"
              />
              <button onClick={onSaveBlossom} className="text-[10px] font-medium text-brand-light">Save</button>
            </div>
          ) : (
            <button onClick={onStartEditBlossom} className="text-[10px] font-medium text-brand-light">
              {blossomUrl ? blossomUrl : "Configure Blossom server"}
            </button>
          )}
        </div>
        <div className="mt-4 space-y-3 text-[10px]">
          <div className="flex items-center justify-between text-text-tertiary">
            <span>Blossom</span>
            <span className="text-text-near-white">{formatSize(totalBytes)}</span>
          </div>
          <div className="flex items-center justify-between text-text-tertiary">
            <span>Encrypted files</span>
            <span className="text-text-near-white">{totalEncrypted} files</span>
          </div>
          <div className="flex items-center justify-between text-text-tertiary">
            <span>Offline cache</span>
            <span className="text-text-near-white">{totalOffline} files</span>
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
  );
}
