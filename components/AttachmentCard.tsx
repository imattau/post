"use client";

import { useState } from "react";

function formatSize(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default function AttachmentCard({
  fileName,
  sizeBytes,
  encrypted,
  sha256,
  mimeType,
  url,
}: {
  fileName: string;
  sizeBytes: number;
  encrypted: boolean;
  sha256: string;
  mimeType: string;
  url?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  function isImage() {
    return mimeType.startsWith("image/");
  }

  return (
    <div className="flex items-center gap-3 h-[88px] px-3 border border-border rounded-[12px] bg-sidebar w-[274px]">
      <div className="w-12 h-14 rounded-[8px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
        {isImage() ? (
          <span className="text-text-tertiary text-[11px] font-bold">▣</span>
        ) : (
          <span className="text-text-tertiary text-[11px] font-bold">▤</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-text-primary truncate">{fileName}</p>
        <p className="text-[10px] text-text-tertiary mt-0.5">
          {formatSize(sizeBytes)} · Blossom{encrypted ? " / encrypted" : ""}
        </p>
        <div className="flex gap-3 mt-1">
          {isImage() && (
            <button
              onClick={() => setPreviewOpen(true)}
              className="text-[10px] font-medium text-brand-light cursor-pointer hover:brightness-110"
            >
              Preview
            </button>
          )}
          <a
            href={`/drive?blob=${sha256}`}
            className="text-[10px] font-medium text-brand-light hover:brightness-110 no-underline"
          >
            Open in Drive
          </a>
        </div>
      </div>
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewOpen(false)}>
          <div className="max-w-[720px] rounded-[12px] border border-border bg-modal-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="truncate text-[13px] font-semibold text-text-modal">{fileName}</p>
              <button onClick={() => setPreviewOpen(false)} className="text-[18px] text-text-modal-2 hover:text-text-modal">×</button>
            </div>
            {url ? (
              <img src={url} alt={fileName} className="max-h-[70vh] max-w-full rounded-[8px] object-contain" />
            ) : (
              <div className="flex h-48 w-80 items-center justify-center rounded-[8px] bg-pill-subtle">
                <p className="text-[12px] text-text-tertiary">Preview unavailable for this attachment.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
