"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Star, EllipsisVertical, BadgeCheck, Check } from "lucide-react";
import { useLabelsStore } from "@/lib/stores/labels";
import { Menu } from "@base-ui/react/menu";

export default function ReadingTopBar({
  onBack,
  starred,
  onToggleStar,
  onArchive,
  onSnooze,
  onDelete,
  onToggleRead,
  onToggleSpam,
  onCopyEventId,
  onReplyAll,
  onForward,
  read,
  spam,
  archived,
  messageId,
}: {
  onBack: () => void;
  starred: boolean;
  onToggleStar: () => void;
  onArchive: () => void;
  onSnooze: () => void;
  onDelete: () => void;
  onToggleRead: () => void;
  onToggleSpam: () => void;
  onCopyEventId: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  read: boolean;
  spam: boolean;
  archived: boolean;
  messageId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const byId = useLabelsStore((s) => s.byId);
  const allIds = useLabelsStore((s) => s.allIds);
  const assignLabel = useLabelsStore((s) => s.assignLabel);
  const removeLabel = useLabelsStore((s) => s.removeLabel);

  const actions = useMemo(
    () => [
      { label: spam ? "Not spam" : archived ? "Move to inbox" : "Archive", onClick: spam ? onToggleSpam : onArchive },
      { label: "Snooze", onClick: onSnooze },
      { label: "Delete", onClick: onDelete },
    ],
    [spam, archived, onArchive, onSnooze, onDelete, onToggleSpam]
  );

  return (
    <div className="flex h-[73px] items-center gap-3 border-b border-border px-6">
      <button
        onClick={onBack}
        aria-label="Back"
        className="text-text-secondary cursor-pointer hover:text-text-near-white transition-colors duration-150"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="ml-1 flex gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="h-9 w-[82px] rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary transition-all duration-150 hover:border-brand/50 cursor-pointer"
          >
            {action.label}
          </button>
        ))}
      </div>
      <button
        onClick={onToggleRead}
        className="h-9 w-[82px] rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary transition-all duration-150 hover:border-brand/50 cursor-pointer"
      >
        {read ? "Mark unread" : "Mark read"}
      </button>
      <div className="flex-1" />
      <button
        onClick={onToggleStar}
        aria-label={starred ? "Unstar" : "Star"}
        className={`cursor-pointer transition-colors duration-150 ${
          starred ? "text-warn" : "text-text-secondary hover:text-text-near-white"
        }`}
      >
        <Star size={19} fill={starred ? "currentColor" : "none"} />
      </button>
      <Menu.Root open={menuOpen} onOpenChange={(open) => setMenuOpen(open)}>
        <Menu.Trigger
          aria-label="More message actions"
          className="text-text-secondary cursor-pointer hover:text-text-near-white transition-colors duration-150"
        >
          <EllipsisVertical size={19} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-20" side="bottom" align="end">
            <Menu.Popup className="w-44 overflow-hidden rounded-[10px] border border-border bg-pill-subtle shadow-lg">
              <Menu.Item onClick={() => { onReplyAll(); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-text-primary hover:bg-surface-active data-[highlighted]:bg-surface-active cursor-pointer">
                Reply all
              </Menu.Item>
              <Menu.Item onClick={() => { onForward(); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-text-primary hover:bg-surface-active data-[highlighted]:bg-surface-active cursor-pointer">
                Forward
              </Menu.Item>
              <Menu.Separator className="border-t border-border my-1" />
              <Menu.Item onClick={() => { onToggleSpam(); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-text-primary hover:bg-surface-active data-[highlighted]:bg-surface-active cursor-pointer">
                {spam ? "Not spam" : "Mark spam"}
              </Menu.Item>
              <Menu.Item onClick={() => { onCopyEventId(); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-text-primary hover:bg-surface-active data-[highlighted]:bg-surface-active cursor-pointer">
                Copy event id
              </Menu.Item>
              <Menu.Separator className="border-t border-border my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold text-text-tertiary tracking-wider">LABELS</div>
              {allIds.length === 0 && (
                <div className="px-3 py-1.5 text-[11px] text-text-tertiary">No labels yet</div>
              )}
              {allIds.map((labelId) => {
                const label = byId[labelId];
                if (!label) return null;
                const assigned = label.messageIds.includes(messageId);
                return (
                  <Menu.Item
                    key={labelId}
                    onClick={() => {
                      if (assigned) removeLabel(messageId, labelId);
                      else assignLabel(messageId, labelId);
                      setMenuOpen(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-[12px] text-text-primary hover:bg-surface-active data-[highlighted]:bg-surface-active flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                    <span className="flex-1">{label.name}</span>
                    {assigned && <Check size={12} className="text-brand-light" />}
                  </Menu.Item>
                );
              })}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
