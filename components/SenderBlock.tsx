import Avatar from "./Avatar";

function formatMessageDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SenderBlock({
  name,
  npub,
  avatarInitials,
  recipientName,
  verified,
  createdAt,
}: {
  name: string;
  npub: string;
  avatarInitials: string;
  recipientName: string;
  verified: boolean;
  createdAt: number;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <Avatar initials={avatarInitials} size={46} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-text-primary">{name}</span>
          <span className="text-[11px] text-text-tertiary truncate">{npub}</span>
          <span className="text-[11px] text-text-tertiary">to {recipientName}</span>
        </div>
        {verified && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-medium text-ok">✓ verified</span>
          </div>
        )}
      </div>
      <span className="text-[11px] text-text-tertiary flex-shrink-0">
        {formatMessageDate(createdAt)}
      </span>
    </div>
  );
}
