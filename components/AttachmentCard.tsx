"use client";

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
}: {
  fileName: string;
  sizeBytes: number;
  encrypted: boolean;
  sha256: string;
  mimeType: string;
}) {
  function isImage() {
    return mimeType.startsWith("image/");
  }

  return (
    <div className="flex items-center gap-3 h-[88px] px-3 border border-border rounded-pill bg-sidebar w-[274px]">
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
            <button className="text-[10px] font-medium text-brand-light cursor-pointer hover:brightness-110">
              Preview
            </button>
          )}
          <a
            href={`/coming-soon?app=D&blob=${sha256}`}
            className="text-[10px] font-medium text-brand-light hover:brightness-110 no-underline"
          >
            Open in Drive
          </a>
        </div>
      </div>
    </div>
  );
}
