export default function SubjectPills({
  labels,
  encrypted,
  isGiftWrapped,
  relayCount,
}: {
  labels: string[];
  encrypted: boolean;
  isGiftWrapped?: boolean;
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
      {encrypted && !isGiftWrapped && (
        <span className="h-[28px] px-3 rounded-pill bg-sidebar border border-border text-ok text-[12px] font-medium leading-[28px]">
          Encrypted
        </span>
      )}
      {isGiftWrapped && (
        <span className="h-[28px] px-3 rounded-pill bg-sidebar border border-border text-brand-light text-[12px] font-medium leading-[28px]">
          Private
        </span>
      )}
      <span className="h-[28px] px-3 rounded-pill bg-sidebar border border-border text-text-secondary text-[12px] font-medium leading-[28px]">
        {relayCount} relays
      </span>
    </div>
  );
}
