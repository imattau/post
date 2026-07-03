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
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
      <button
        onClick={onBack}
        className="text-text-secondary text-[20px] font-medium cursor-pointer hover:text-text-near-white transition-colors duration-150"
      >
        ←
      </button>
      <div className="flex gap-2 ml-2">
        {["Archive", "Snooze", "Delete"].map((label) => (
          <button
            key={label}
            className="h-9 w-[82px] rounded-[10px] border border-border bg-sidebar text-text-secondary text-[12px] font-medium cursor-pointer hover:border-brand/50 transition-all duration-150"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <button
        onClick={onToggleStar}
        className={`text-[19px] font-semibold cursor-pointer transition-colors duration-150 ${
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
