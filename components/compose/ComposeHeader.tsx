"use client";

import { memo, useCallback } from "react";
import { Minus, X } from "lucide-react";
import { useComposeStore } from "@/lib/stores/compose";

export const ComposeHeader = memo(function ComposeHeader({ onRequestClose }: { onRequestClose: () => void }) {
  const status = useComposeStore((s) => s.status);
  const savedAt = useComposeStore((s) => s.draft.savedAt);
  const minimize = useComposeStore((s) => s.minimize);

  const isSending = status === "sending";

  const handleMinimize = useCallback(() => {
    minimize();
  }, [minimize]);

  const handleClose = useCallback(() => {
    onRequestClose();
  }, [onRequestClose]);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-modal-stroke">
      <div className="flex items-center gap-3">
        <span className="text-[16px] font-semibold text-text-modal">New message</span>
        {savedAt && status === "composing" && (
          <span className="text-[11px] font-medium text-ok">Draft saved</span>
        )}
        {status === "sending" && <span className="text-[11px] font-medium text-brand-light">Sending…</span>}
        {status === "failed" && <span className="text-[11px] font-medium text-danger">Send failed</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleMinimize}
          disabled={isSending}
          className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150 disabled:opacity-40"
        >
          <Minus size={15} className="text-text-modal-2" />
        </button>
        <button
          onClick={handleClose}
          disabled={isSending}
          className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150 disabled:opacity-40"
        >
          <X size={15} className="text-text-modal-2" />
        </button>
      </div>
    </div>
  );
});
