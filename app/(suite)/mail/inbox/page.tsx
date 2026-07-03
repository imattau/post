export default function InboxPage() {
  return (
    <>
      {/* List Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h2 className="text-[22px] font-semibold text-white">Inbox</h2>
          <p className="text-text-secondary text-[11px]">12 unread</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-5 py-2">
        <div className="flex items-center gap-2 h-[42px] px-3 bg-sidebar border border-border rounded-pill">
          <span className="text-text-tertiary text-[15px]">⌕</span>
          <span className="text-text-placeholder text-[13px]">Search messages, people or npubs</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 px-5 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {["Primary", "Unread", "Starred", "Attachments"].map((chip) => (
          <button
            key={chip}
            className={`h-[30px] px-3 rounded-pill text-[12px] font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap ${
              chip === "Primary"
                ? "bg-surface-active border-brand text-brand-light"
                : "bg-sidebar border-border text-text-secondary hover:border-brand/50"
            }`}
          >
            {chip}
          </button>
        ))}
        <button className="text-text-secondary text-[18px] font-semibold ml-1 cursor-pointer">⋮</button>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-tertiary text-[13px]">No messages yet</p>
      </div>
    </>
  );
}
