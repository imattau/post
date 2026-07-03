export default function ReadingTopBar({
  onBack,
  starred,
  onToggleStar,
  onArchive,
  onSnooze,
  onDelete,
}: {
  onBack: () => void;
  starred: boolean;
  onToggleStar: () => void;
  onArchive: () => void;
  onSnooze: () => void;
  onDelete: () => void;
}) {
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
      <div className="flex-1" />
      <button
        onClick={onToggleStar}
        className={`text-[19px] font-normal cursor-pointer transition-colors duration-150 ${
          starred ? "text-warn" : "text-text-secondary hover:text-text-near-white"
        }`}
      >
        ☆
      </button>
      <button
        disabled
        aria-label="More message actions unavailable"
        className="text-[19px] font-semibold text-text-tertiary cursor-not-allowed opacity-50"
      >
        ⋮
      </button>
    </div>
  );
}
