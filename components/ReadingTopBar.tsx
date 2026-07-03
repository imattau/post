export default function ReadingTopBar({
  onBack,
  starred,
  onToggleStar,
}: {
  onBack: () => void;
  starred: boolean;
  onToggleStar: () => void;
}) {
  return (
    <div className="flex h-[73px] items-center gap-3 border-b border-border px-6">
      <button
        onClick={onBack}
        className="text-text-secondary text-[20px] font-medium cursor-pointer hover:text-text-near-white transition-colors duration-150"
      >
        ←
      </button>
      <div className="ml-1 flex gap-2">
        {["Archive", "Snooze", "Delete"].map((label) => (
          <button
            key={label}
            className="h-9 w-[82px] rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary transition-all duration-150 hover:border-brand/50 cursor-pointer"
          >
            {label}
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
      <button className="text-[19px] font-semibold text-text-secondary cursor-pointer hover:text-text-near-white transition-colors duration-150">
        ⋮
      </button>
    </div>
  );
}
