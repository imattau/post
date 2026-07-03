"use client";

export default function ComposeModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(5,7,11,0.44)" }}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className="fixed z-50 animate-[composeOpen_250ms_ease-out]"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 730,
          height: 784,
        }}
      >
        {/* Shadow wrapper */}
        <div
          className="w-full h-full rounded-[24px]"
          style={{ boxShadow: "0 20px 40px 0 rgba(0,0,0,0.5)" }}
        >
          {/* Inner card */}
          <div className="w-full h-full rounded-[20px] bg-modal-card border border-modal-stroke flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-modal-stroke">
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-text-modal">New message</span>
                <span className="text-[11px] font-medium text-ok">Draft saved</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150"
                >
                  <span className="text-text-modal-2 text-[15px]">–</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150"
                >
                  <span className="text-text-modal-2 text-[15px]">×</span>
                </button>
              </div>
            </div>

            {/* Recipient field */}
            <div className="flex items-start gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2 pt-1">To</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                <div className="h-[34px] px-3 rounded-[17px] bg-surface-active border border-brand flex items-center gap-1.5">
                  <div className="w-[22px] h-[22px] rounded-full bg-avatar-1 flex items-center justify-center">
                    <span className="text-white text-[9px] font-semibold">A</span>
                  </div>
                  <span className="text-[12px] text-white font-medium">Alice</span>
                  <button className="text-text-modal-2 text-[14px] cursor-pointer hover:text-text-modal">×</button>
                </div>
                <span className="text-[13px] text-text-placeholder">Add people, npubs or groups</span>
              </div>
              <div className="flex gap-1">
                <button className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Cc</button>
                <span className="text-[11px] text-text-modal-2"> </span>
                <button className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Bcc</button>
              </div>
            </div>

            {/* Subject field */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2">Subject</span>
              <span className="text-[13px] text-text-placeholder">Add a subject…</span>
            </div>

            {/* Body */}
            <div className="flex-1 p-5">
              <p className="text-[14px] text-text-placeholder">Write your message…</p>
            </div>

            {/* Attachment card */}
            <div className="px-5 pb-2">
              <div className="flex items-center gap-3 h-[74px] px-3 border border-modal-stroke rounded-pill bg-modal-attach w-[326px]">
                <div className="w-12 h-14 rounded-[8px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
                  <span className="text-text-tertiary text-[11px] font-bold">▣</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-text-modal truncate">design-spec.pdf</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">2.4 MB · encrypted</p>
                  <p className="text-[10px] font-medium text-ok mt-0.5">Stored in Drive</p>
                </div>
                <button className="text-text-modal-2 text-[15px] cursor-pointer hover:text-text-modal">×</button>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-2 px-5 py-2">
              <span className="h-[26px] px-3 rounded-pill bg-surface-active border border-brand text-ok text-[11px] font-medium leading-[26px]">Encrypted</span>
              <span className="h-[26px] px-3 rounded-pill border border-modal-stroke text-text-modal-2 text-[11px] font-medium leading-[26px]">3 relays</span>
              <span className="h-[26px] px-3 rounded-pill border border-modal-stroke text-text-modal-2 text-[11px] font-medium leading-[26px]">Private</span>
              <div className="flex-1" />
              <button className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Delivery settings</button>
            </div>

            {/* Format toolbar */}
            <div className="flex items-center gap-0.5 px-5 py-1.5 border-t border-modal-stroke">
              {["B", "I", "U", "⌁", "▣", "☺", "@", "⋯"].map((glyph) => (
                <button
                  key={glyph}
                  className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-semibold rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
                >
                  {glyph}
                </button>
              ))}
              <span className="text-[10px] text-text-placeholder ml-2">Markdown supported</span>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-modal-stroke">
              <div className="flex">
                <button className="h-10 px-5 rounded-l-pill bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150">
                  Send
                </button>
                <button className="h-10 w-[34px] rounded-r-pill bg-brand text-white flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150 border-l border-white/20">
                  <span className="text-[12px]">⌄</span>
                </button>
              </div>
              <button className="h-10 px-4 rounded-pill bg-modal-2 border border-modal-stroke text-text-modal-2 text-[12px] font-medium cursor-pointer hover:brightness-110 transition-all duration-150">
                Schedule send
              </button>
              <div className="flex-1" />
              <button className="text-[11px] font-medium text-danger cursor-pointer hover:brightness-110 transition-all duration-150">
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
