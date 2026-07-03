export default function ReplyComposer({ recipientName }: { recipientName: string }) {
  return (
    <div className="mx-10 mb-11 mt-2 w-[560px] max-w-[calc(100%-80px)]">
      <p className="mb-[17px] text-[14px] font-medium text-text-near-white">{recipientName}</p>
      <div className="h-[130px] rounded-pill border border-border bg-sidebar flex flex-col">
        <div className="flex-1 px-5 pt-[18px]">
          <span className="text-[13px] text-text-placeholder">Reply to {recipientName}…</span>
        </div>
        <div className="mx-5 h-px bg-border" />
        <div className="flex h-[63px] items-center gap-1 px-5">
          {["B", "I", "⌁", "☺"].map((glyph) => (
            <button
              key={glyph}
              className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
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
    </div>
  );
}
