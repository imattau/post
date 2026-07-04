"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DriveFile } from "@/lib/types";

interface FileContextMenuProps {
  file: DriveFile;
  onClose: () => void;
  onDownload: (file: DriveFile) => void;
  onShare: (file: DriveFile) => void;
  onStar: (file: DriveFile) => void;
  onTrash: (file: DriveFile) => void;
  onRename?: (file: DriveFile) => void;
}

export default function FileContextMenu({ file, onClose, onDownload, onShare, onStar, onTrash, onRename }: FileContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items: Array<{ label: string; action: () => void; danger?: boolean }> = [
    { label: "Download", action: () => onDownload(file) },
    { label: "Share", action: () => onShare(file) },
    { label: file.starred ? "Unstar" : "Star", action: () => onStar(file) },
    ...(onRename ? [{ label: "Rename", action: () => onRename(file) }] : []),
    { label: file.trashed ? "Restore" : "Trash", action: () => onTrash(file), danger: !file.trashed },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1 w-[180px] rounded-[12px] border border-border bg-dock py-1 shadow-lg"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`flex w-full items-center px-4 py-2.5 text-left text-[12px] font-medium hover:bg-surface-active ${
            item.danger ? "text-danger" : "text-text-secondary"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
