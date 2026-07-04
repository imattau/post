import type { MockMessage } from "@/lib/mock/threads";
import Avatar from "./Avatar";

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h`;
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const LABEL_COLORS: Record<string, string> = {
  Work: "var(--color-info)",
  Friends: "var(--color-ok)",
  Projects: "var(--color-warn)",
  Receipts: "var(--color-danger)",
};

export default function MessageRow({
  message,
  selected,
  onClick,
  batchMode = false,
  batchSelected = false,
  onBatchToggle,
}: {
  message: MockMessage;
  selected: boolean;
  onClick: () => void;
  batchMode?: boolean;
  batchSelected?: boolean;
  onBatchToggle?: () => void;
}) {
  return (
    <div
      onClick={batchMode ? onBatchToggle : onClick}
      className={`flex gap-4 px-4 py-4 my-[4px] border border-border rounded-pill bg-sidebar cursor-pointer transition-all duration-150 min-h-[104px] ${
        selected || batchSelected
          ? "ring-1 ring-brand"
          : "hover:bg-sidebar/80"
      }`}
    >
      {batchMode ? (
        <div className="flex items-center flex-shrink-0" onClick={(e) => { e.stopPropagation(); onBatchToggle?.(); }}>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 cursor-pointer ${
            batchSelected ? "bg-brand border-brand" : "border-border"
          }`}>
            {batchSelected && <span className="text-white text-[12px] font-bold">✓</span>}
          </div>
        </div>
      ) : (
        <Avatar initials={message.sender.avatarInitials} size={40} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-[13px] ${
              !message.read
                ? "font-semibold text-text-primary"
                : "font-medium text-text-near-white"
            }`}
          >
            {message.sender.name}
          </span>
          {!message.read && <div className="w-[7px] h-[7px] rounded-full bg-brand-light flex-shrink-0" />}
          <span className={`ml-auto text-[11px] flex-shrink-0 ${!message.read ? "font-semibold text-white" : "text-text-tertiary"}`}>
            {formatTime(message.createdAt)}
          </span>
        </div>
        <p
          className={`truncate text-[12px] mt-2 ${
            !message.read ? "font-semibold text-text-primary" : "font-medium text-text-near-white"
          }`}
        >
          {message.subject}
        </p>
        <p className="text-[11px] text-text-tertiary truncate mt-[7px]">{message.preview}</p>
        {message.labels.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {message.labels.map((label) => (
              <span
                key={label}
                className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[12px] leading-[28px]"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
