import { memo } from "react";
import isEqual from "react-fast-compare";
import type { MockMessage } from "@/lib/mock/threads";
import { MessageCircle, CheckCheck, X } from "lucide-react";
import RelativeTime from "./RelativeTime";
import Avatar from "./Avatar";

interface ConversationGroup {
  conversationId: string;
  messages: MockMessage[];
}

function uniqueParticipants(messages: MockMessage[]): { name: string; initials: string }[] {
  const seen = new Set<string>();
  return messages
    .map((m) => ({ name: m.sender.name, initials: m.sender.avatarInitials }))
    .filter((p) => {
      const key = p.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function ConversationRow({
  group,
  selected,
  onClick,
}: {
  group: ConversationGroup;
  selected: boolean;
  onClick: () => void;
}) {
  const { messages } = group;
  const latest = messages.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  const participants = uniqueParticipants(messages);
  const unread = messages.some((m) => !m.read);

  return (
    <div
      onClick={onClick}
      className={`flex gap-4 px-4 py-4 my-[4px] border border-border rounded-pill bg-sidebar cursor-pointer transition-all duration-150 min-h-[104px] ${
        selected
          ? "ring-1 ring-brand"
          : "hover:bg-sidebar/80"
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar initials={participants[0]?.initials ?? "?"} size={40} />
        {participants.length > 1 && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-dock border border-border flex items-center justify-center">
            <span className="text-[7px] font-semibold text-text-tertiary">
              {participants.length > 9 ? "9+" : `+${participants.length - 1}`}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-[13px] ${
              unread
                ? "font-semibold text-text-primary"
                : "font-medium text-text-near-white"
            }`}
          >
            {participants.length <= 2
              ? participants.map((p) => p.name).join(", ")
              : `${participants[0].name} +${participants.length - 1}`}
          </span>
          {unread && <div className="w-[7px] h-[7px] rounded-full bg-brand-light flex-shrink-0" />}
          {messages.some((m) => m.deliveryStatus === "delivered") && <CheckCheck size={12} className="text-ok flex-shrink-0" />}
          {messages.some((m) => m.deliveryStatus === "failed") && <X size={12} className="text-danger flex-shrink-0" />}
          <span className={`ml-auto text-[11px] flex-shrink-0 ${unread ? "font-semibold text-white" : "text-text-tertiary"}`}>
            <RelativeTime ts={latest.createdAt} />
          </span>
        </div>
        <p
          className={`truncate text-[12px] mt-2 ${
            unread ? "font-semibold text-text-primary" : "font-medium text-text-near-white"
          }`}
        >
          {latest.subject}
        </p>
        <p className="text-[11px] text-text-tertiary truncate mt-[7px]">{latest.preview}</p>
        <div className="flex gap-1.5 mt-1.5">
          <div className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[12px] leading-[28px] flex items-center gap-1">
            <MessageCircle size={11} />
            <span>{messages.length}</span>
          </div>
          {latest.labels.length > 0 && latest.labels.map((label) => (
            <span
              key={label}
              className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[12px] leading-[28px]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export { type ConversationGroup };
export default memo(ConversationRow, (prev, next) => isEqual(prev, next));
