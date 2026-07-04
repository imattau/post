import { formatDate } from "@/lib/utils";
import Avatar from "./Avatar";

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
    <div className="flex items-start gap-4">
      <Avatar initials={avatarInitials} size={46} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-near-white">{name}</p>
        <p className="mt-1 truncate text-[11px] text-text-tertiary">{npub}</p>
        <p className="mt-1 text-[11px] text-text-tertiary">to {recipientName}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-[11px] text-text-tertiary">{formatDate(createdAt)}</p>
        {verified && <p className="mt-1 text-[10px] font-medium text-ok">✓ verified</p>}
      </div>
    </div>
  );
}
