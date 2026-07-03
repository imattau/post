export default function ReplyComposer({ recipientName }: { recipientName: string }) {
  return (
    <div className="mx-6 mb-5 mt-2 h-[130px] max-w-[560px] border border-border rounded-pill bg-sidebar flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="text-[12px] text-text-secondary font-medium">{recipientName}</span>
      </div>
      <div className="flex-1 px-4 py-1">
        <span className="text-[13px] text-text-placeholder">Reply to {recipientName}…</span>
      </div>
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-border">
        {["B", "I", "⌁", "☺"].map((glyph) => (
          <button
            key={glyph}
            className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-semibold rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
          >
            {glyph}
          </button>
        ))}
        <div className="flex-1" />
        <button className="h-[34px] w-[90px] rounded-[10px] bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150">
          Send
        </button>
      </div>
    </div>
  );
}
