"use client";

import { memo } from "react";
import { X, File } from "lucide-react";
import { formatSize } from "@/lib/utils";

interface UploadItem {
  id: string;
  fileName: string;
  sizeBytes: number;
  progress: number;
  status: "pending" | "uploading" | "uploaded" | "failed";
  error: string | null;
}

export interface AttachmentCardsProps {
  uploads: UploadItem[];
  onRemove: (id: string, fileName: string) => void;
}

export const AttachmentCards = memo(function AttachmentCards({
  uploads,
  onRemove,
}: AttachmentCardsProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="px-5 pb-2 flex flex-col gap-2">
      {uploads.map((u) => (
        <div key={u.id} className="flex items-center gap-3 h-[74px] px-3 border border-modal-stroke rounded-pill bg-modal-attach">
          <div className="w-12 h-14 rounded-[8px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
            <File size={18} className="text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-text-modal truncate">{u.fileName}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">
              {formatSize(u.sizeBytes)}
              {u.status === "uploading" && ` · Uploading ${u.progress}%`}
              {u.status === "uploaded" && " · Encrypted · Stored in Drive"}
              {u.status === "failed" && ` · Failed: ${u.error}`}
            </p>
            {u.status === "uploading" && (
              <div className="w-full h-[3px] bg-pill-subtle rounded-progress mt-1">
                <div className="h-full bg-ok rounded-progress" style={{ width: `${u.progress}%` }} />
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(u.id, u.fileName)}
            className="text-text-modal-2 cursor-pointer hover:text-text-modal"
          ><X size={15} /></button>
        </div>
      ))}
    </div>
  );
});
