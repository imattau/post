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
    <div className="flex items-center gap-2 px-6 pt-1 pb-1">
      {labels.map((label) => (
        <span
          key={label}
          className="h-[26px] px-3 rounded-pill bg-surface-active border border-brand text-brand-light text-[11px] font-medium leading-[26px]"
        >
          {label}
        </span>
      ))}
      {encrypted && (
        <span className="h-[26px] px-3 rounded-pill border border-border text-ok text-[11px] font-medium leading-[26px]">
          Encrypted
        </span>
      )}
      <span className="h-[26px] px-3 rounded-pill border border-border text-text-secondary text-[11px] font-medium leading-[26px]">
        {relayCount} relays
      </span>
    </div>
  );
}
