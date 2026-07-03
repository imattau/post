export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 grid grid-cols-[248px_448px_1fr] divide-x divide-border">
      {/* Sidebar */}
      <div className="bg-sidebar flex flex-col p-4 gap-1 overflow-y-auto">
        {/* Brand */}
        <div className="mb-5">
          <h1 className="text-text-near-white text-[21px] font-semibold">N Mail</h1>
          <p className="text-text-secondary text-[11px]">Private messaging for Nostr</p>
        </div>

        {/* Compose CTA */}
        <button className="w-full h-12 bg-brand rounded-pill flex items-center gap-2 justify-center cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150">
          <span className="text-white text-[15px]">＋</span>
          <span className="text-white text-[13px] font-semibold">Compose</span>
        </button>

        {/* Mailbox rows */}
        <nav className="flex flex-col gap-0.5 mt-6">
          {[
            { icon: "▣", label: "Inbox", count: 12, active: true },
            { icon: "☆", label: "Starred", count: null, active: false },
            { icon: "◷", label: "Snoozed", count: null, active: false },
            { icon: "➤", label: "Sent", count: null, active: false },
            { icon: "▤", label: "Drafts", count: 2, active: false },
            { icon: "⌁", label: "Archive", count: null, active: false },
            { icon: "!", label: "Spam", count: null, active: false },
          ].map((item) => (
            <a
              key={item.label}
              href={`/mail/${item.label.toLowerCase()}`}
              className={`flex items-center gap-3 h-[38px] px-3 rounded-[10px] no-underline transition-all duration-150 ${
                item.active
                  ? "bg-surface-active text-white"
                  : "text-text-secondary hover:text-text-near-white hover:brightness-110"
              }`}
            >
              <span className="text-[15px]">{item.icon}</span>
              <span className={`flex-1 text-[13px] ${item.active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
              {item.count !== null && (
                <span className={`text-[13px] ${item.active ? "text-brand-light" : "text-text-secondary"}`}>
                  {item.count}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Labels header */}
        <p className="text-text-tertiary text-[10px] font-semibold tracking-wider mt-6 mb-2 px-3">LABELS</p>

        {/* Label rows */}
        <div className="flex flex-col gap-0.5">
          {[
            { name: "Work", color: "var(--color-info)" },
            { name: "Friends", color: "var(--color-ok)" },
            { name: "Projects", color: "var(--color-warn)" },
            { name: "Receipts", color: "var(--color-danger)" },
          ].map((label) => (
            <div
              key={label.name}
              className="flex items-center gap-3 h-[30px] px-3 text-text-secondary hover:text-text-near-white cursor-pointer rounded-[10px] transition-all duration-150"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
              <span className="text-[13px] font-medium">{label.name}</span>
            </div>
          ))}
        </div>

        {/* Spacer + Network status card */}
        <div className="flex-1" />
        <div className="border border-border rounded-pill bg-dock p-3">
          <p className="text-[12px] font-semibold text-white">Network</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full bg-ok" />
            <span className="text-[11px] text-text-secondary">0 relays connected</span>
          </div>
          <p className="text-[10px] text-text-tertiary mt-1">Delivery health</p>
          <div className="w-full h-[3px] bg-pill-subtle rounded-progress mt-1">
            <div className="h-full bg-ok rounded-progress" style={{ width: "0%" }} />
          </div>
          <p className="text-[10px] text-text-tertiary mt-1">Synced — ago</p>
        </div>
      </div>

      {/* Message List panel */}
      <div className="bg-canvas flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Reading Pane panel */}
      <div className="bg-dock flex items-center justify-center">
        <p className="text-text-tertiary text-[13px]">Select a message to read</p>
      </div>
    </div>
  );
}
