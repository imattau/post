const LABEL_COLORS: Record<string, string> = {
  Work: "var(--color-info)",
  Friends: "var(--color-ok)",
  Projects: "var(--color-warn)",
  Receipts: "var(--color-danger)",
};

export default function SubjectPills({
  labels,
  encrypted,
  relayCount,
}: {
  labels: string[];
  encrypted: boolean;
  relayCount: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className="h-[28px] px-3 rounded-pill bg-surface-active border border-brand text-brand-light text-[12px] font-medium leading-[28px]"
        >
          {label}
        </span>
      ))}
      {encrypted && (
        <span className="h-[28px] px-3 rounded-pill bg-sidebar border border-border text-ok text-[12px] font-medium leading-[28px]">
          Encrypted
        </span>
      )}
      <span className="h-[28px] px-3 rounded-pill bg-sidebar border border-border text-text-secondary text-[12px] font-medium leading-[28px]">
        {relayCount} relays
      </span>
    </div>
  );
}
