"use client";

import { useState } from "react";
import { useLabelsStore } from "@/lib/stores/labels";

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
  read,
  spam,
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
  read: boolean;
  spam: boolean;
  messageId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const byId = useLabelsStore((s) => s.byId);
  const allIds = useLabelsStore((s) => s.allIds);
  const assignLabel = useLabelsStore((s) => s.assignLabel);
  const removeLabel = useLabelsStore((s) => s.removeLabel);

  const actions = [
    { label: "Archive", onClick: onArchive },
    { label: "Snooze", onClick: onSnooze },
    { label: "Delete", onClick: onDelete },
  ];

  return (
    <div className="flex h-[73px] items-center gap-3 border-b border-border px-6">
      <button
        onClick={onBack}
        className="text-text-secondary text-[20px] font-medium cursor-pointer hover:text-text-near-white transition-colors duration-150"
      >
        ←
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
        className={`text-[19px] font-normal cursor-pointer transition-colors duration-150 ${
          starred ? "text-warn" : "text-text-secondary hover:text-text-near-white"
        }`}
      >
        ☆
      </button>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="More message actions"
          className="text-[19px] font-semibold text-text-secondary cursor-pointer hover:text-text-near-white transition-colors duration-150"
        >
          ⋮
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-[10px] border border-border bg-pill-subtle shadow-lg">
            <button
              onClick={() => { onToggleSpam(); setMenuOpen(false); }}
              className="block w-full px-3 py-2 text-left text-[12px] text-text-primary hover:bg-surface-active"
            >
              {spam ? "Not spam" : "Mark spam"}
            </button>
            <button
              onClick={() => { onCopyEventId(); setMenuOpen(false); }}
              className="block w-full px-3 py-2 text-left text-[12px] text-text-primary hover:bg-surface-active"
            >
              Copy event id
            </button>
            <div className="border-t border-border my-1" />
            <div className="px-3 py-1 text-[10px] font-semibold text-text-tertiary tracking-wider">LABELS</div>
            {allIds.length === 0 && (
              <div className="px-3 py-1.5 text-[11px] text-text-tertiary">No labels yet</div>
            )}
            {allIds.map((labelId) => {
              const label = byId[labelId];
              if (!label) return null;
              const assigned = label.messageIds.includes(messageId);
              return (
                <button
                  key={labelId}
                  onClick={() => {
                    if (assigned) removeLabel(messageId, labelId);
                    else assignLabel(messageId, labelId);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-text-primary hover:bg-surface-active flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                  <span className="flex-1">{label.name}</span>
                  {assigned && <span className="text-brand-light">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
