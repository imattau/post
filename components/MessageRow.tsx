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
}: {
  message: MockMessage;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 px-4 py-4 mx-5 my-1 border border-border rounded-pill bg-sidebar cursor-pointer transition-all duration-150 ${
        selected
          ? "ring-1 ring-brand"
          : "hover:bg-sidebar/80"
      }`}
    >
      <Avatar initials={message.sender.avatarInitials} size={40} />
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
          {!message.read && <div className="w-[9px] h-[9px] rounded-full bg-brand-light flex-shrink-0" />}
          <span className="ml-auto text-[11px] flex-shrink-0 text-text-tertiary">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <p
          className={`truncate text-[12px] mt-0.5 ${
            !message.read ? "font-semibold text-text-primary" : "font-medium text-text-near-white"
          }`}
        >
          {message.subject}
        </p>
        <p className="text-[11px] text-text-tertiary truncate mt-0.5">{message.preview}</p>
        {message.labels.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {message.labels.map((label) => (
              <span
                key={label}
                className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[10px] font-medium leading-[28px]"
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
