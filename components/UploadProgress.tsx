"use client";

export interface UploadFile {
  id: string;
  name: string;
  sizeBytes: number;
  progress: number;
  status: "pending" | "uploading" | "complete" | "failed" | "cancelled";
  letter: string;
  color: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  uploading: { bar: "var(--color-warn)", text: "var(--color-warn)" },
  complete: { bar: "var(--color-ok)", text: "var(--color-ok)" },
  failed: { bar: "var(--color-danger)", text: "var(--color-danger)" },
  cancelled: { bar: "var(--color-pill-subtle)", text: "var(--color-text-tertiary)" },
  pending: { bar: "var(--color-pill-subtle)", text: "var(--color-text-tertiary)" },
};

function statusLabel(status: string, progress: number): string {
  switch (status) {
    case "uploading": return `${progress}%`;
    case "complete": return "Complete";
    case "failed": return "Failed";
    case "cancelled": return "Cancelled";
    default: return "Pending";
  }
}

export default function UploadProgress({
  files,
  totalComplete,
  totalCount,
  onHide,
  onCancel,
  onRetry,
}: {
  files: UploadFile[];
  totalComplete: number;
  totalCount: number;
  onHide: () => void;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(5, 7, 11, 0.35)" }}
      />
      <div
        className="fixed z-50 rounded-[18px] border border-border bg-dock shadow-lg"
        style={{ width: 500, height: 340, left: 886, top: 594 }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-[16px] font-semibold text-text-modal">
            Uploading {totalCount} {totalCount === 1 ? "file" : "files"}
          </span>
          <span className="text-[11px] font-medium text-text-secondary">
            {totalComplete} of {totalCount} complete
          </span>
        </div>

        <div className="px-6 py-2 space-y-3">
          {files.map((file) => {
            const colors = STATUS_COLORS[file.status] || STATUS_COLORS.pending;
            const label = statusLabel(file.status, file.progress);
            const barWidth =
              file.status === "complete" ? 100 : file.status === "uploading" ? file.progress : 0;

            return (
              <div
                key={file.id}
                className="flex items-center gap-3 h-15 px-3 border border-border rounded-[12px] bg-sidebar"
              >
                <div
                  className="w-9 h-9 rounded-[9px] bg-pill-subtle flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-[14px] font-bold" style={{ color: file.color }}>
                    {file.letter}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-text-near-white truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: colors.text }}>
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-tertiary">{formatSize(file.sizeBytes)}</span>
                    <div className="flex gap-2">
                      {(file.status === "uploading" || file.status === "pending") && onCancel && (
                        <button
                          onClick={() => onCancel(file.id)}
                          className="text-[10px] font-medium text-danger hover:brightness-110"
                        >
                          Cancel
                        </button>
                      )}
                      {file.status === "failed" && onRetry && (
                        <button
                          onClick={() => onRetry(file.id)}
                          className="text-[10px] font-medium text-brand-light hover:brightness-110"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  {file.status !== "pending" && file.status !== "cancelled" && (
                    <div className="w-[288px] h-1 bg-pill-subtle rounded-[2px] mt-1.5">
                      <div
                        className="h-full rounded-[2px] transition-all duration-300"
                        style={{ width: `${barWidth}%`, backgroundColor: colors.bar }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-[10px] text-text-secondary">
            Encrypting before upload · {totalCount} {totalCount === 1 ? "provider selected" : "providers selected"}
          </span>
          <button
            onClick={onHide}
            className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110"
          >
            Hide
          </button>
        </div>
      </div>
    </>
  );
}
