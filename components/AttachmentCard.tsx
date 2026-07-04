"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { formatSize } from "@/lib/utils";

export default function AttachmentCard({
  fileName,
  sizeBytes,
  encrypted,
  sha256,
  mimeType,
  url,
  storedInDrive,
  onSaveToDrive,
}: {
  fileName: string;
  sizeBytes: number;
  encrypted: boolean;
  sha256: string;
  mimeType: string;
  url?: string;
  storedInDrive?: boolean;
  onSaveToDrive?: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function isImage() {
    return mimeType.startsWith("image/");
  }

  async function handleSave() {
    if (!onSaveToDrive) return;
    setSaving(true);
    try {
      await onSaveToDrive();
    } finally {
      setSaving(false);
    }
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
          {storedInDrive ? (
            <a
              href={`/drive?blob=${sha256}`}
              className="text-[10px] font-medium text-brand-light hover:brightness-110 no-underline"
            >
              Open in Drive
            </a>
          ) : (
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="text-[10px] font-medium text-brand-light cursor-pointer hover:brightness-110 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save to Drive"}
            </button>
          )}
        </div>
      </div>
      <Dialog.Root open={previewOpen} onOpenChange={(open) => setPreviewOpen(open)}>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Portal>
        <Dialog.Popup className="fixed z-50 max-w-[720px] rounded-[12px] border border-border bg-modal-card p-4 shadow-lg" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="truncate text-[13px] font-semibold text-text-modal">{fileName}</p>
            <Dialog.Close className="text-[18px] text-text-modal-2 hover:text-text-modal cursor-pointer">×</Dialog.Close>
          </div>
          {url ? (
            <img src={url} alt={fileName} className="max-h-[70vh] max-w-full rounded-[8px] object-contain" />
          ) : (
            <div className="flex h-48 w-80 items-center justify-center rounded-[8px] bg-pill-subtle">
              <p className="text-[12px] text-text-tertiary">Preview unavailable for this attachment.</p>
            </div>
          )}
        </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
