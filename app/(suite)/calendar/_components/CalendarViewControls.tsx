"use client";

import Link from "next/link";

type CalendarView = "month" | "week" | "agenda";

const VIEW_TABS: Array<{ id: CalendarView; label: string; href: string }> = [
  { id: "month", label: "Month", href: "/calendar" },
  { id: "week", label: "Week", href: "/calendar/week" },
  { id: "agenda", label: "Agenda", href: "/calendar/agenda" },
];

function tabClass(active: boolean): string {
  return active
    ? "border border-brand/70 bg-surface-active text-brand-light"
    : "text-text-secondary hover:text-text-near-white";
}

export default function CalendarViewControls({
  activeView,
  onToday,
  onPrevious,
  onNext,
  showMore = true,
}: {
  activeView: CalendarView;
  onToday?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showMore?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {onToday && (
        <button
          type="button"
          onClick={onToday}
          className="h-9 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white"
        >
          Today
        </button>
      )}

      {(onPrevious || onNext) && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-pill-subtle text-[18px] text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous period"
            disabled={!onPrevious}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-pill-subtle text-[18px] text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next period"
            disabled={!onNext}
          >
            ›
          </button>
        </div>
      )}

      <div className="flex rounded-pill border border-border bg-pill-subtle p-1">
        {VIEW_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`h-8 rounded-pill px-4 text-[12px] no-underline transition-colors ${tabClass(tab.id === activeView)}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {showMore && (
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-pill-subtle text-[16px] text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white"
          aria-label="More actions"
        >
          ⋮
        </button>
      )}
    </div>
  );
}
